window.site = {
  player:        null, // Video player on the page
  previousY:     0,    // The Y position of the scrollbar before the user scrolls again.
  scrollDir:     "up", // Keep track of whether the user is scrolling 'up' or 'down'.
  scrollTimer:   500,  // Amount of time to wait before calculating fixed header sizes
  scrollTimeout: null, // The timer for scrolling
  waypoints:     [],   // An array of every Waypoint on the page.
  transition: { // Transition speeds and events
    fast:   300,
    normal: 500,
    slow:   750,
    end:    "webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend",
    start:  "transitionstart"
  },
  form: {
    /**
     *  Append source code query params to certain form actions and success urls.
     **/
    addSourceCodes: function() {
      var source =
        TIUtils.params().sc ||
        TIUtils.params().source ||
        TIUtils.params().refcode;

      if (typeof source !== "undefined") {
        // Add a source query param to each form action
        $.each($("form"), function(i, form) {
          var action = $(form).attr("action"),
            paramName;

          if (action.indexOf("actblue") !== -1) {
            // Act Blue links should pass the source param as 'refcode'.
            paramName = "refcode";
          } else {
            paramName = "source";
          }

          if (action.indexOf("?") === -1) {
            // Form action does not contain query params, so add the first one
            $(form).attr("action", action + "?" + paramName + "=" + source);
          } else {
            // Form action contains query params, so append this one.
            $(form).attr("action", action + "&" + paramName + "=" + source);
          }
        });

        // Add a refcode query param to each success url
        $.each(
          $("input[name='SuccessUrl'], input[name='success_url']"),
          function(i, input) {
            var url = $(input).val(),
              paramName;

            if (url.indexOf("actblue") !== -1) {
              // Act Blue links should pass the source param as 'refcode'.
              paramName = "refcode";
            } else {
              paramName = "source";
            }

            if (url.indexOf("?") === -1) {
              // Form action does not contain query params, so add the first one
              $(input).val(url + "?" + paramName + "=" + source);
            } else {
              // Form action contains query params, so append this one.
              $(input).val(url + "&" + paramName + "=" + source);
            }
          }
        );
      }
    },

    /**
     *  When a form is submitted, determine the redirect URL or show a thank you message.
     **/
    afterSubmit: function() {
      var successUrl;
      $form = $("form.after-submit-hook");

      if ($form.find("input[name='successUrl']").length === 1) {
        successUrl = $form.find("input[name='successUrl']").val();
      } else if ($form.find("input[name='success_url']").length === 1) {
        successUrl = $form.find("input[name='success_url']").val();
      }

      if (typeof successUrl === "string") {
        // Redirect to success url
        var redirectUrl =
          successUrl + (successUrl.indexOf('?') > 0 ? "&" : "?") + 
          "email=" +
          $("#email").val() +
          "&zip=" +
          $("#zip").val();
        console.log("about to redirect to " + redirectUrl + " in afterSubmit.")
        window.location = redirectUrl;
      } else {
        // Show thank you message
        $form.fadeToggle(
          site.transitionSpeed,
          function() {
            $("#"+$form.attr('id')+"-response").fadeToggle(site.transitionSpeed);
          }
        );
      }
    },


    /**
     * Submit a form with and run the callback function. If the AJAX request fails for any reason, then try submitting the form to the hidden iframe.
     * @param {object} form - The HTML element for the form
     * @param {Number} delay - The number of milliseconds to wait until the callback runs. Should be 0 between steps, and 2000 before a redirect.
     * @param {function} callback - The Javascript code to run after a 2 second delay
     **/
    submit: function(form, delay, callback) {
      $.ajax({
        method: "POST",
        url: $(form).attr("action"),
        data: $(form).serialize(),
        success: function(data) {
          callback.call();
        },
        error: function() {
          form.submit();
          window.setTimeout(callback, delay);
        }
      });
    },

    /**
     * Track form submissions
     * @param {string} category - The category, such as 'form'
     * @param {string} action - The action, such as 'submit'
     * @param {string} label - The label, such as a form endpoint
     **/
    trackEvent: function(category, action, label) {
      if (typeof ga !== "undefined") {
        ga("send", "event", category, action, label);
      }

      if (typeof fbq !== "undefined") {
        fbq("track", "Lead", {
          content_category: category,
          content_name: label
        });
      }

      // Not sure this works so commenting out for now (using single-event tag instead)
      /*
        twq('track','signup', {
            content_category: category,
            content_name: label
        });
        */

      if (typeof twttr !== "undefined") {
        twttr.conversion.trackPid("o1iai", {
          tw_sale_amount: 0,
          tw_order_quantity: 0
        });
        new Image(1, 1).src =
          "https://ad.ipredictive.com/d/track/cvt/pixel?acct_id=19647&cache_buster=" +
          Math.floor(Date.now() / 1000);
      }
    }
  }
}


// Default jquery.validate configuration
site.form_opts = {
  validateOptions: $.extend({
    errorElement: "strong",
    errorPlacement: function(error, element) {
      $container = $("#hub-form");
      error.appendTo($container.find(".error-msg"));
    },
    rules: {
      zip_code: {
        required: true,
        zip_code: true
      }
    },
    messages: {
      zip_code: {
        required: "Invalid zip",
        zip_code: "Invalid zip"
      },
      email: {
        required: "Invalid email",
        email: "Invalid email"
      }
    }
  }, TIUtils.validationDefaults),
  redirectOptions: {
    parameterMap: {
      sc:         'ReferrerSourceCode',
      refcode:    'ReferrerSourceCode',
      refcode2:   'SessionSourceCode',
      email:      'EmailAddress',   
      zip:        'PostalCode',
      first_name: 'FirstName',
      last_name:  'LastName'
    }
  }
};

/**
 * FUNCTIONS
 */
/**
 * Uses query parameters to fill in form fields.
 */
site.autoFillForm = function(){
  var firstNameParam = TIUtils.params().firstname;
  var lastNameParam  = TIUtils.params().lastname;
  var emailParam     = TIUtils.params().email;
  var zipParam       = TIUtils.params().zip;
  var akidParam      = TIUtils.params().akid;
  
  if(firstNameParam){
    $("#firstname").val(firstNameParam);
  }
  if(lastNameParam){
    $("#lastname").val(lastNameParam);
  }
  if(emailParam){
    $("#email").val(emailParam);
    $("#emailaddress").val(emailParam);
  }
  if(zipParam){
    $("#zip").val(zipParam);
    $("#postalcode").val(zipParam);
  }
  if(akidParam) {
    $("input[name='referring_akid']").val(akidParam);
  }
};

/**
 * When .fixed is applied to <body>, resize some of the <header> elements.
 */
site.fixedHeader = function(){
  var headerHeight = $(".header").height(),
      fixedHeight  = $(".fixed").height();

  if($("body").hasClass("fixed")){
    $(".fixed").attr("style", "height: " + (fixedHeight - headerHeight) + "px");
  } else {
    $(".fixed").removeAttr("style");
  }
  
  clearTimeout(site.scrollInterval);
};

/**
 * Adds some margin-top to the next visible element after <header>
 */
site.headerPadding = function(){
  //$(".main-menu").css({height: site.headerHeight});
  //$(".header").nextAll(":visible:first").removeAttr("style").css("margin-top", site.headerHeight+"px"); 
  
  if($(window).width() < 1300){
    $(".hero").attr("style", "");
  } else {
    $(".mobile-intro").attr("style", "");
  }
};

/**
 * Adds padding to some menu items when the page loads.
 */
site.menuPadding = function(){};

/**
 * Called whenever the window is scrolled.
 */
site.scrollCallback = function(){
    var scrollY = site.scrollY();

    // Toggle body.fixed
    if (scrollY >= site.headerHeight) {
      $("body").addClass("fixed");
  
    } else if(scrollY < site.headerHeight){
      $("body").removeClass("fixed");
    }
    
  // Keep track of which direction the user is scrolling
  if (scrollY > site.previousY){
    site.scrollDir = "down";
  } else {
    site.scrollDir = "up";
  }
  
  // Clamp the previousY to 0
  site.previousY = scrollY <= 0 ? 0 : scrollY;
};

/**
 * What is the Y position of the scrollbar?
 * @return {Integer} - The number of pixels from the top of the window that the user has scrolled.
 */
site.scrollY = function(){
  return window.scrollY || window.pageYOffset;
};


(function() {
  window.TIUtils || (window.TIUtils = {});

  TIUtils.PDFTracker = function(disabled, category, action, selector) {
    this.disabled = disabled || false;
    this.category = category || "Documents";
    this.action = action || "Click";
    this.selector = selector || "a[href$='.pdf']";

    this.template = function(href){
      var _this = this;
      
      
      
      if(window._gaq){
        return "_gaq.push(['_trackEvent', '" + _this.category + "', '" + _this.action + "', '" + href + "']);";
      } else if(window.ga){
        return "ga('send', 'event', '" + _this.category + "', '" + _this.action + "', '" + href + "');";
      }
    };

    this.run = function(){
      var _this = this;
      
      if(!_this.disabled){
        $(_this.selector).each(function(i, link){
          tracking = _this.template($(link).attr("href"));
          existingOnclick = $(link).attr("onclick") || "";

          $(link).attr("onclick", tracking + existingOnclick);
        });
      } else {
        console.log("Automatic tracking of PDFs disabled.");
      }
    
      return _this;
    };
  };
})();


$(document).ready(function($) {
  /**
   * EVENT LISTENERS
   */
   
  pdfTracker = new TIUtils.PDFTracker();
  pdfTracker.category = 'Documents';
  pdfTracker.selector = "a[href$='.pdf'], a[href$='.doc'], a[href$='.docx'], a[href$='.xls'], a[href$='.xlsx'], a[href$='.ppt'], a[href$='.pptx']";
  pdfTracker.run();

  // Resize the menu button when the header resizes
  $(".header").on(site.transition.end, function(e){
    if(e.target.tagName === "HEADER"){
      if(document.location.pathname !== ""){
        site.headerHeight = $(".header").height();
        site.headerPadding();
      }
    }
  });

  $(window).on("resize", function(){
    setTimeout(site.headerPadding, site.transition.normal);
    setTimeout(site.menuPadding, site.transition.normal);
  });

	$(".menu-trigger").click(function(){
	  if($("body").hasClass("reveal-menu")){
		$("body").removeClass("reveal-menu").removeClass("reveal-items");
	  } else {
		$("body").addClass("reveal-menu");

		window.setTimeout(function(){
		  $("body").addClass("reveal-items");
		}, 200);
	  }
	});

  $(window).on("scroll", site.scrollCallback);

  $("body").on("keyup", "[data-role='phone']", function(){
    $(this).val(TIUtils.formatPhone($(this).val())); 
  });

  /**
   * DO THIS ON PAGE LOAD
   */

  site.headerHeight = $(".header").height();
  site.form.addSourceCodes();
  site.autoFillForm();
  site.headerPadding();
  site.menuPadding();
  $(".header-intro-message-teaser").attr("style", "height: " + $(".header-intro-message-teaser").height() + "px");

  if(window.hasOwnProperty("SmoothScroll")){
    site.smoothScroll = new SmoothScroll("[data-scroll]", {
      offset: 100
    });
  }

  site.waypoints.push($('.trigger').waypoint({
    handler: function(direction) {
      jQuery(this.element).addClass('reveal');
    }, offset: '90%'
  }));
  site.waypoints.push($('.custom-trigger').waypoint({
    handler: function(direction) {
      jQuery(this.element).addClass('reveal');
    }, offset: '90%'
  }));
  site.waypoints.push($('.low-trigger').waypoint({
    handler: function(direction) {
      jQuery(this.element).addClass('reveal');
    }, offset: '95%'
  })); 

  site.waypoints.push($('.low-trigger').waypoint({
    handler: function(direction) {
      jQuery(this.element).addClass('reveal');
    }, offset: '65%'
  }));  
  
  /** FORM ACTION HANDLERS **/
	 
	$("#download-form-footer").validate($.extend({}, site.form_opts, 
	  { submitHandler: function(e) {
		  site.form.submit(e,50,function(){
			var form_id = $(e).attr('id');
			site.form.trackEvent('form','submit',form_id)
		  $("#" + form_id).fadeToggle(function() {
			  $("#" + form_id +"-response").fadeToggle();
			}); 			            
		  });
	   }
	 }));
	 
	$("#contact-form").validate($.extend({}, site.form_opts, 
	  { submitHandler: function(e) {
		  site.form.submit(e,50,function(){
			var form_id = $(e).attr('id');
			site.form.trackEvent('form','submit',form_id)
		  $("#" + form_id).fadeToggle(function() {
			  $("#" + form_id +"-response").fadeToggle();
			}); 			            
		  });
	   }
	 }));
	 
	$("#action-form").validate($.extend({}, site.form_opts, 
	  { submitHandler: function(e) {
		  site.form.submit(e,50,function(){
			var form_id = $(e).attr('id');
			site.form.trackEvent('form','submit',form_id)
		  $("#" + form_id).fadeToggle(function() {
			  $("#" + form_id +"-response").fadeToggle();
			}); 			            
		  });
	   }
	 }));
	 
	$(".ak-form").validate($.extend({}, site.form_opts, 
	  { submitHandler: function(e) {
		  site.form.submit(e,50,function(){
			var form_id = $(e).attr('id');
			site.form.trackEvent('form','submit',form_id)
		  $("#" + form_id).fadeToggle(function() {
			  $("#" + form_id +"-response").fadeToggle();
			}); 			            
		  });
	   }
	 }));
	 
	$(".ak-form-with-redirect").validate($.extend({}, site.form_opts, 
	  { submitHandler: function(e) {
		  site.form.submit(e,50,function(){
			  var form_id = $(e).attr('id');
			  site.form.trackEvent('form','submit',form_id)
		    site.form.afterSubmit();			            
		  });
	   }
	 }));
});

document.addEventListener("touchstart", function() {},false);
