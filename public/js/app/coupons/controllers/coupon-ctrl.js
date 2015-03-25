/**
 * [y] hybris Platform
 *
 * Copyright (c) 2000-2015 hybris AG
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of hybris
 * ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the
 * license agreement you entered into with hybris.
 */
'use strict';

angular.module('ds.coupon', [])
    /**
     *  Coupon Module contoller.
     */
    .controller('CouponCtrl', ['$scope', 'AuthSvc', 'AuthDialogManager', 'CouponSvc', 'UserCoupon',
        function( $scope, AuthSvc, AuthDialogManager, CouponSvc, UserCoupon ) {

            $scope.couponCollapsed = true;
            $scope.coupon = UserCoupon.getCoupon();

            $scope.$on('couponUpdated', function(e, userCoupon) {
                $scope.coupon = userCoupon;
            });


            $scope.applyCoupon = function(couponCode) {

                var totalPrice = $scope.cart.totalPrice.value;
                if(!checkAuthentication(couponCode)){
                    return;
                }

                //call coupon service to get discount.
                CouponSvc.validateCoupon(couponCode, totalPrice).then(function (couponData) {
                    $scope.coupon = UserCoupon.setCoupon(couponData);
                    $scope.coupon.applied = true;
                    $scope.coupon.valid = true;

                    if ( couponData.discountType === 'ABSOLUTE' ) {
                        // set discount to subtotal if it is greater than subtotal
                        if (couponData.discountAbsolute.amount > $scope.cart.subTotalPrice.value){
                            $scope.coupon.amounts.discountAmount = $scope.cart.subTotalPrice.value;
                        } else {
                            $scope.coupon.amounts.discountAmount = couponData.discountAbsolute.amount;
                        }
                    }
                    else if ( couponData.discountType === 'PERCENT' ) {
                        // must round percentage here in order to match service api discount comparison validation.
                        $scope.coupon.amounts.discountAmount = parseFloat( 0.01 * couponData.discountPercentage * $scope.cart.totalPrice.value).toFixed(2);
                    }
                }, function (e) {  //upstream error handler.
                    $scope.coupon.valid = false;
                    $scope.coupon.message.error = e.data.message;
                });
            };

            $scope.removeCoupon = function() {
                UserCoupon.setBlankCoupon();
            };

            function checkAuthentication(couponCode){
                if (!AuthSvc.isAuthenticated()) {
                    var dlg = AuthDialogManager.open({windowClass:'mobileLoginModal'}, {}, {}, true);
                    dlg.then(function(){
                            if (AuthSvc.isAuthenticated()) {
                                $scope.applyCoupon(couponCode);
                            }
                        }
                    );
                    return false;
	            }
	            return true;
            };

            function smartDiscount(discountAmount){
                // if discount is greater than cart subtotal, discount is subtotal.
                if(discountAmount > $scope.cart.subTotalPrice.value ){
                    return angular.copy($scope.cart.subTotalPrice.value);
                }
                return discountAmount;
            };

    }]);


