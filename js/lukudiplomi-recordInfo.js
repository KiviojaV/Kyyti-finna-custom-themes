// Overrides few selected methods in image paginator so we can use our own AJAX endpoint
// to show recordinfo instead of image information
FinnaPaginator.prototype.onNonZoomableClick = function onNonZoomableClick(image) {
  var _ = this;

  var icon = _.canvasElements.noZoom.find('.iconlabel');
  icon.addClass(_.settings.iconlabelClass).hide();
  _.canvasElements.noZoom.find('img').css('opacity', '0.5');
  _.openImageIndex = image.attr('index');

  // Toggle canvas element first to ensure that it is correctly sized for model viewer:
  _.setCanvasElement('noZoom');
  _.setCurrentVisuals();
  _.setPagerInfo();
  if (typeof _.settings.onlyImage === 'undefined' || _.settings.onlyImage === false) {
    _.loadImageInformation();
  }
  _.setBrowseButtons();


  var img = new Image();
  img.src = image.data('large');
  $(img).attr('alt', image.data('alt'));
  img.onload = function onLoad() {
    if (typeof _.canvasElements.noZoom === 'undefined') {
      return;
    }
    if (this.naturalWidth && this.naturalWidth === 10 && this.naturalHeight === 10) {
      _.canvasElements.noZoom.addClass('no-image');
      icon.show();
      $(this).attr('alt', translations.no_cover);
    } else if (_.canvasElements.noZoom.hasClass('no-image')) {
      icon.hide();
    }
    _.canvasElements.noZoom.find('img,finna-model-viewer').replaceWith($(this));
  };

};

// Customized function to get recordinfo such as subject terms, length, 
FinnaPaginator.prototype.loadImageInformation = function loadImageInformation() {
  var _ = this;
  var src = VuFind.path + '/AJAX/JSON?method=lukudiplomiRecordInfo&id=' + encodeURIComponent(_.settings.recordId) + '&index=' + _.openImageIndex;
  if (typeof _.settings.recordSource != 'undefined') {
    src += '&source=' + encodeURIComponent(_.settings.recordSource);
  }
  if (typeof publicList !== 'undefined') {
    src += '&publicList=1';
  }
  // Include current search id
  const searchId = VuFind.getCurrentSearchId();
  if (searchId) {
    src += "&sid=" + encodeURIComponent(searchId);
  }

  _.popup.collapseArea.html('<div class="large-spinner">' + VuFind.icon('spinner') + '</div>');
  $.ajax({
    url: src,
    dataType: 'html'
  }).done(function setImageData(response) {
    _.popup.collapseArea.html(VuFind.updateCspNonce(JSON.parse(response).data.html));
    _.popup.summary = _.popup.collapseArea.find('.summary');
    _.setDimensions();

    if (_.settings.recordType === 'marc') {
      _.loadBookDescription();
    } else {
      finna.layout.initTruncate(_.popup.collapseArea);
      $('.imagepopup-holder .summary').removeClass('loading');
    }
    VuFind.lightbox.bind('.imagepopup-holder');
    if (typeof $('.open-link a').attr('href') !== 'undefined') {
      _.setDimensions();
    }
    _.popup.collapseArea.find('finna-video').on('click', () => {
      _.setCanvasElement('video');
    });
    if ($('.imagepopup-holder .feedback-record')[0] || $('.imagepopup-holder .save-record')[0]) {
      $('.imagepopup-holder .feedback-record, .imagepopup-holder .save-record').on('click', function onClickActionLink(/*e*/) {
        $.fn.finnaPopup.closeOpen();
      });
    }

    var itemStatusHolderEl = document.getElementById("collapseTwo");
    itemStatusHolderEl.innerHTML = '<div>' + VuFind.icon('spinner') + '</div>';

    var itemStatusClass = '.' + (encodeURIComponent(_.settings.recordId)).replace('.', '-') + '-itemstatus';
    var clonableNode = $(itemStatusClass)[0];
    var note = $(clonableNode).siblings('.list-note').clone();

    if (note[0] && typeof(note[0]) !== 'undefined') {
      note[0].removeAttribute('hidden');
      $('.collapse-content-holder .record-notes')[0].appendChild(note[0]);
    }


    // Yhteinen renderöintifunktio
    function renderItemstatus() {
      itemStatusHolderEl.innerHTML = '';

      var clone = $(clonableNode).clone();
      var el = clone[0];

      el.removeAttribute('hidden');
      itemStatusHolderEl.appendChild(el);

      clone.find('a.btn-primary.hidden-print').on('click', function () {
        $.fn.finnaPopup.closeOpen();
      });

      VuFind.lightbox.bind('.imagepopup-holder .title-hold');
    }

    function hasData() {
      return clonableNode.querySelector('div.holdings.truncate-field.truncate-done');
    }

    // Jos data jo valmiina
    if (hasData()) {
      renderItemstatus();
    } else {
      let handled = false;

      const observer = new MutationObserver(() => {
        if (handled) return;

        if (hasData()) {
          handled = true;
          renderItemstatus();
          observer.disconnect();
        }
      });

      observer.observe(clonableNode, {
        childList: true,
        subtree: true
      });
    }

    _.setRecordIndex();

  }).fail(function setImageDataFailure() {
    _.popup.collapseArea.html('');
    _.setRecordIndex();
  });
};

FinnaPaginator.prototype.loadPage = function loadPage(direction, openImageIndex, imagesPerPage) {
  var _ = this;
  _.clearTracks();

  if (typeof imagesPerPage !== 'undefined') {
    _.settings.imagesPerPage = imagesPerPage;
  }

  if (typeof openImageIndex !== 'undefined' && openImageIndex !== null) {
    var desiredImage = +openImageIndex;
    if (desiredImage > _.images.length || desiredImage < 0) {
      desiredImage = 0;
    }
    _.offSet = desiredImage;
  }

  _.offSet += _.settings.imagesPerPage * direction;
  if (_.offSet < 0) {
    _.offSet = 0;
  }

  var max = _.settings.imagesPerPage - 1;
  var lastImage = max + _.offSet;

  if (lastImage > _.images.length - 1) {
    lastImage = _.images.length - 1;
    _.offSet = lastImage;
  } else if (lastImage < 0) {
    lastImage = 0;
  }

  var firstImage = lastImage - max;
  if (firstImage < 1) {
    _.offSet = 0;
    firstImage = 0;
  }
  var column = 1;
  var cur = '';
  for (var currentImage = firstImage; currentImage <= lastImage; currentImage++) {
    if (column === 1) {
      cur = $('<div/>');
      _.appendTracks(cur);
    }
    var image = _.createImagePopup(_.images[currentImage], currentImage);
    if (typeof image !== 'undefined') {
      cur.append(image);
      column = (column === _.settings.imagesPerRow) ? 1 : column + 1;
    }
  }
  _.setCurrentVisuals();
  _.setButtons();
};

/**
 * Modified ChangeTriggerImage to consume imagepopup elements data to create image trigger and find listId.
 * As in this version we want to show record info instead of image info, we show pop-up window even where there is only
 * placeholder image to show
 * @param {HTMLElement} imagePopup Small image element to get data from to open trigger image
 */
FinnaPaginator.prototype.changeTriggerImage = function changeTriggerImage(imagePopup) {
  var _ = this;
  
  var img = _.trigger.find('img');


  img.attr('data-src', imagePopup.attr('href'));
  img.attr('alt', imagePopup.data('alt'));
  if (_.openImageIndex !== imagePopup.attr('index')) {
    img.css('opacity', 0.5);
  }
  /**
   * Set image properties when image has loaded
   * @param {HTMLImageElement} image Image to set
   */
  function setImageProperties(image) {
    $(image).css('opacity', '');
    _.setDimensions();
    var width = image.naturalWidth;
    var height = image.naturalHeight;
    const recordCoverContainer = img.closest('.recordcover-container');
    var containerWidth = recordCoverContainer.width();
    var containerHeight = recordCoverContainer.height();
    if (width) {
      if (width === 10 && height === 10) {
        _.trigger.addClass('no-image');//.trigger('removeclick');
        $(image).attr('alt', '');
        if (_.settings.isList) {
          if (_.images.length < 2) {
            _.settings.enableImageZoom = false;
          }
          $(image).parents('.grid').addClass('no-image');
        }
        if (!_.settings.isList && _.images.length <= 1) {
          _.root.css('display', 'none');
          _.root.siblings('.image-details-container:not(:has(.image-rights))').addClass('hidden');
        }
        // If the image measurements are less than 60% of their container's measurements
      } else if (_.root.parents().hasClass('record-main') && (width / containerWidth < 0.6) && (height / containerHeight < 0.6)) {
        _.trigger.css('aspect-ratio', 'auto');
        $('.image-description').css('text-align', 'center');
      }
    } else if (_.trigger.hasClass('no-image')) {
      _.trigger.removeClass('no-image');
    }
  }

  _.imageDetail.html(imagePopup.data('description'));
  img.off('load').on('load', function handleImage() {
    if (!_.settings.isList) {
      _.showImageDetails(imagePopup);
    }
    setImageProperties(this);
  });
  if (_.trigger.hasClass('no-image')) {
    _.trigger.removeClass('no-image');
  }
  VuFind.observerManager.observe(
    'LazyImages',
    img[0].parentNode.querySelectorAll('img[data-src]')
  );
};

