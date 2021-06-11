;(function($){

$(document).ready(function() {

    if ( ! ('jltma_custom_bp_data' in window) ) return;

    if ( ! $('#custom_breakpoints_page').length ) return;
        
    new Vue({

        el: '#custom_breakpoints_page',

        data: {
            show_pro_message: false,
            disable_add_breakpoint: false,
            custom_breakpoints: [],
            default_devices: ['desktop', 'tablet', 'mobile'],
            default_breakpoints: [],
            custom_breakpoints: []
        },

        computed: {
            
            all_breakpoints() {

                var _this = this;

                var breakpoints = this.default_breakpoints.concat( this.custom_breakpoints );

                breakpoints = this.validation( breakpoints );

                if ( ! breakpoints.length ) return [];

                var desktop = this.get_device_data( breakpoints, 'desktop' );
                var tablet = this.get_device_data( breakpoints, 'tablet' );
                var mobile = this.get_device_data( breakpoints, 'mobile' );

                var desktop_min = _this.cashed_breakpoints.lg;
                var tablet_max = _this.cashed_breakpoints.lg - 1;
                var mobile_max = _this.cashed_breakpoints.md - 1;

                breakpoints.forEach(function( _bp ) {
                    
                    if ( _this.in_array(_bp.key, _this.default_devices) ) return;
                    if ( _bp.min == 0 || _bp.max == 0 ) return;

                    if ( _bp.max >= desktop_min ) desktop_min = Number(_bp.max + 1);
                    if ( _bp.min > mobile_max && _bp.min <= tablet_max ) tablet_max = _bp.min - 1;
                    if ( _bp.min <= mobile_max ) mobile_max = _bp.min - 1;

                });

                desktop.min = desktop_min;
                tablet.max = tablet_max;
                mobile.max = mobile_max;

                return this.sort_breakpoints( breakpoints );

            },

        },

        mounted() {

            this.isPro = !! jltma_custom_bp_data.is_pro;

            this.set_breakpoitns();

            this.sort_breakpoints();

            this.form_submits();

            this.breakpoint_limit_checker();

        },

        methods: {

            breakpoint_limit_checker() {

                if ( this.isPro ) return false; // there is no limit;

                if ( this.custom_breakpoints.length > 1 ) {
                    this.show_pro_message = true;
                    this.disable_add_breakpoint = true;
                    return true
                }

                this.show_pro_message = false;
                this.disable_add_breakpoint = false;

                return false;

            },

            remove_breakpoint( deviceKey ) {

                var index = this.custom_breakpoints.findIndex(function(_dev) {
                    return _dev.key == deviceKey;
                });

                this.custom_breakpoints.splice( index, 1 );

                if ( this.breakpoint_limit_checker() );

                this.sort_breakpoints();

            },

            sort_breakpoints( breakpoints ) {

                _this = this;
                
                var breakpoints = breakpoints || this.all_breakpoints || [];

                return breakpoints.sort(function( prev, next ) {
                    
                    if ( next.key == 'desktop' ) return 1;
                    if ( _this.in_array(prev, _this.custom_breakpoints) && (prev.min == 0 || prev.max == 0) ) return 1;
                    if ( prev.max < next.max ) return 1;

                    return -1;

                });

            },
            
            validation( breakpoints ) {

                if ( ! breakpoints.length ) return [];

                breakpoints.forEach(function( _bp ) {

                    if ( _bp.key != 'desktop' ) _bp.max = Number( _bp.max );

                    _bp.min = Number(_bp.min);

                });

                return breakpoints;

            },

            get_device_data( devices, deviceKey ) {

                return devices.find(function(_dev) {
                    return _dev.key == deviceKey;
                });

            },

            in_array( item, list ) {

                return list.indexOf( item ) > -1;

            },
            
            set_breakpoitns() {

                var _this = this;

                this.cashed_breakpoints = window.jltma_custom_bp_data.breakpoints;

                var devices = window.jltma_custom_bp_data.devices;

                this.default_breakpoints = devices.filter(function( _filter ) {
                    return _this.in_array( _filter.key, _this.default_devices );
                });

                this.custom_breakpoints = devices.filter(function( _filter ) {
                    return ! _this.in_array( _filter.key, _this.default_devices );
                });

            },
            
            add_device() {

                var _this = this;

                if ( this.breakpoint_limit_checker() ) return;

                this.custom_breakpoints.forEach(function(_dev) {
                    _this.$set( _dev, 'isRecent', false );
                });

                var data = {
                    key: Math.random().toString(36).substr(2, 9),
                    name: 'Test',
                    min: 0,
                    max: 0,
                    isDraft: true,
                    isRecent: true
                }

                this.$set( this.custom_breakpoints, this.custom_breakpoints.length, data );

            },

            valueChanged( event, device, type ) {
                
                device[type] = Number( $(event.target).val() );

            },

            inputFocused( event, device ) {

                this.custom_breakpoints.forEach(function(_dev) {
                    this.$set( _dev, 'isRecent', false );
                }.bind(this));

                this.$set( device, 'isRecent', true );

            },

            get_form_data() {

                var custom_breakpoints = JSON.parse( JSON.stringify(this.custom_breakpoints) ); // disabled vue reactivity

                return custom_breakpoints.map(function(_bp) {
                    
                    return {
                        name: _bp.name,
                        input1: Number(_bp.min),
                        input2: Number(_bp.max)
                    }

                });

            },

            form_submits() {

                var _this = this;

                // Import Breakpoints Form
                jQuery("#elementor_settings_import_form").submit( function(evt) {

                    evt.preventDefault();

                    var formData = new FormData(jQuery(this)[0]);

                    jQuery.ajax({
                        url: masteraddons.ajaxurl,
                        type: 'POST',
                        data: formData,
                        dataType: 'json',
                        async: true,
                        cache: false,
                        contentType: false,
                        enctype: 'multipart/form-data',
                        processData: false,
                        success: function (response) {
                            if ( response == 'ok' )  {
                                jQuery('#elementor_import_success').slideDown();
                                setTimeout(function() {
                                    window.location.reload();
                                }, 1000);
                            }
                        }
                    });

                    return false;

                });


                // Reset Form
                jQuery("#elementor_settings_reset_form").submit(function(evt){
                    evt.preventDefault();
                    var formData = new FormData(jQuery(this)[0]), reset_form = $('#reset_form').val();
                    jQuery.ajax({
                        url: masteraddons.ajaxurl,
                        type: 'POST',
                        data: {
                            'security': reset_form,
                            action: 'jltma_mcb_reset_settings'
                        },
                        dataType: 'json',
                        async: true,
                        cache: false,
                        success: function ( response ) {
                            if ( response == 'ok' ) {
                                jQuery('#reset_success').slideDown();
                                setTimeout(function() {
                                    window.location.reload();
                                }, 1000);
                            }
                        }
                    });
                    return false;
                });

                //Save Breakpoints
                jQuery("#jlmta-cbp-form").submit(function(e) {

                    e.preventDefault();

                    var form = $(this);
                    
                    form.addClass('loading');

                    $.ajax({
                        url: masteraddons.ajaxurl,
                        method: 'POST',
                        data: {
                            form_fields: _this.get_form_data(),
                            'security': $('#breakpoints_form').val(),
                            action: 'jltma_mcb_save_settings'
                        },
                        success : function( data ) {
                            form.prepend( '<div class="updated"><p>Saved Breakpoints</p></div>' );
                            setTimeout(function() {
                                form.removeClass('loading');
                                form.find('.updated').remove();
                            }, 700 );
                        },
                        error : function(error){
                            console.log('failed', error);
                        }
                    });

                });

            }

        },

    });

});

})(jQuery);