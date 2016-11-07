var UUI = UUI || {};

UUI.Global_Menu = (function() {
    'use strict';

    function Global_Menu() {}
    Global_Menu.prototype.init = function () {
        var $global_menu = $('.uui-global-menu');
        var $global_menu_content = $('.uui-global-menu .global-menu-content');
        var $tools_items = $('.tools-list');
        var $global_menu_hide = $('.uui-global-menu .global-menu-journalHeader .global-menu-hide');

        $global_menu.find('.my-tools-settings').tooltip();

        $tools_items.each(function () {
            $(this).find('.tools-group-body').hide();
            $(this).find('.arrow').removeClass('fa-angle-up').addClass('fa-angle-down');
        });

        var $tool_list_current_group = $('.tools-list.my-tools, .tools-list.current-group');
        $tool_list_current_group.find('.tools-group-body').show();
        $tool_list_current_group.find('.arrow').removeClass('fa-angle-down').addClass('fa-angle-up');

        var $global_menu_tools = $('.global-menu-tools');
        $global_menu_tools.css('height', $(window).height() - $('.global-menu-journalHeader').height() -
            $('.global-menu-search').height());
        $global_menu_tools.mCustomScrollbar();

        $('.global-menu').click(function () {
            if (UUI.Util.viewport().width >= 768) {
                $global_menu.css('height', $(document).height());
                $global_menu.show();
                $global_menu_content.animate({ right: 0 }, 300);
            }
        });

        $('.responsive-global-menu').click(function () {
            if (UUI.Util.viewport().width < 768) {
                $global_menu.css('height', $(document).height());
                $global_menu.show();
                $global_menu_content.animate({ right: 0 }, 300);
            }
        });

        $global_menu_hide.click(function () {
            if (UUI.Util.viewport().width >= 768) {
                $global_menu_content.animate({ right: -360 }, 300, function () {
                    $global_menu.hide();
                });
            }
            else {
                $global_menu_content.animate({ right: '100%' }, 300, function () {
                    $global_menu.hide();
                });
            }
        });

        $('.tools-group-heading').click(function () {
            var $header = $(this);
            var $body = $header.parents('.tools-list').find('.tools-group-body');
            if ($body.is(':visible')) {
                $body.slideUp();
                $header.find('.arrow').removeClass('fa-angle-up').addClass('fa-angle-down');
            } else {
                $body.slideDown();
                $header.find('.arrow').removeClass('fa-angle-down').addClass('fa-angle-up');
            }
        });

        $(window).resize(function () {
            $('.global-menu-tools').css('height', $(window).height() - $('.global-menu-journalHeader').height() -
                $('.global-menu-search').height());
            if ($global_menu.is(':hidden')) {
                if (UUI.Util.viewport().width >= 768) {
                    $global_menu_content.css('right', -360);
                }
                else {
                    $global_menu_content.css('right', '100%');
                }
            }
        });
    };

    return new Global_Menu();
}());
