var picoModal = require('./picoModal');

var i = 0,
    modal,
    parentEl = document.getElementById("results");

if (window.addEventListener) {
  window.addEventListener("keydown", donkey, true)
} else if (document.attachEvent) {
  window.attachEvent("keydown", donkey)
}

var input = document.getElementsByTagName('input')[0],
    curSel;

function findCenterElement (min, max, scrolled) {
  var results = document.getElementById("results").children,
      median = Math.floor((max-min)/2+min),
      medianOffset = results[median].offsetTop;

  if (medianOffset == scrolled || max-min == 1) {
    findSel = document.querySelector("#selected");
    findSel && findSel.removeAttribute('id');
    results[median].setAttribute('id','selected');
    i = median;
    return;
  } else if (medianOffset > scrolled) {
    findCenterElement(min, median, scrolled);
  } else if (medianOffset < scrolled) {
    findCenterElement(median, max, scrolled);
  }
}

function donkey(event) {
  var childCnt = parentEl.children.length;

  // close keybindings modal if open
  if (document.querySelector("#keyContainer")) {
    modal.close();
    return;
  }

  // resets index on new search
  if (!document.querySelector("#selected")) {
    i = 0;
  }

  // handle down
  if (event.keyCode === 40) {
    // are there results?
    if (!childCnt) {
      return;
    }

    event.stopImmediatePropagation();
    event.preventDefault();
    input.blur();

    var min = 0,
        max = document.getElementById("results").children.length,
        scrolled = window.pageYOffset+window.innerHeight/2;

    // console.log(min, max, scrolled)
    if (document.querySelector("#selected")) {
      found = document.querySelector("#selected");
      if (found.offsetTop < window.pageYOffset || found.offsetTop > window.pageYOffset+window.innerHeight) {
        findCenterElement(min, max, scrolled);
        return;
      }
    } else if (window.pageYOffset > window.innerHeight) {
      console.log('bye')
      findCenterElement(min, max, scrolled);
      return;
    }

    // have already marked first item
    if (i === 0 && parentEl.children[0].hasAttribute('id') && childCnt !== 1) {
      parentEl.children[i].removeAttribute('id');
      i++;
      parentEl.children[i].setAttribute('id', 'selected');
    } else {
      if (i !== childCnt) {
        // are we at the end
        if (i + 1 < childCnt && i !== 0) {
          i++;
        }

        if (i > 0) {
          parentEl.children[i-1].removeAttribute('id');
        }
        parentEl.children[i].setAttribute('id','selected');
      }
    }

    curSel = document.getElementById("selected");
    curSel && window.scroll(window.pageXOffset, curSel.offsetTop-window.innerHeight/2);

    return false;

    // handle up
  } else if (event.keyCode === 38) {

    // are there results?
    if (!childCnt) {
      return;
    }

    event.stopImmediatePropagation();
    event.preventDefault();
    input.blur();

    var min = 0,
        max = document.getElementById("results").children.length,
        scrolled = window.pageYOffset+window.innerHeight/2;

    if (document.querySelector("#selected")) {
      found = document.querySelector("#selected");
      if (found.offsetTop < window.pageYOffset || found.offsetTop > window.pageYOffset+window.innerHeight) {
        findCenterElement(min, max, scrolled);
        return;
      }
    } else if (window.pageYOffset > window.innerHeight) {
      findCenterElement(min, max, scrolled);
      return;
    }

    if (i>0) {
      parentEl.children[i].removeAttribute('id');
      parentEl.children[i-1].setAttribute('id', 'selected');
      i--;
    } else {
      parentEl.children[i].removeAttribute('id');
      input.focus();
    }

    curSel = document.getElementById("selected");
    curSel && window.scroll(window.pageXOffset, curSel.offsetTop-window.innerHeight/2);
    return false;

  // handle return
  } else if (event.keyCode === 13) {
    curSel = document.getElementById("selected");
    curSel && curSel.getElementsByClassName("homepage")[0].click();

  // handle / and ?
  } else if (event.keyCode === 191) {
    // prevent on ? or if / has been pressed already
    if (event.shiftKey || (!event.shiftKey && (input != document.activeElement))) {
      event.stopImmediatePropagation();
      event.preventDefault();
      input.blur();
    }

    // /
    if (!event.shiftKey && (input != document.activeElement)) {
      curSel = document.getElementById("selected");

      // do we have a selection or have we scrolled?
      if (curSel) {
        curSel.removeAttribute('id');
        input.focus();
        input.select();
      } else if (window.pageYOffset > 0) {
        input.focus();
        input.select();
      }

      // scroll top
      window.scroll(window.pageXOffset, 0);

    // ?
    } else if (event.shiftKey) {

      // is there a modal already open?
      if (document.querySelector("#keyContainer")) {
        return;
      }
      modal = picoModal({
        content: "<div id=\"keyContainer\">" +
                 "<div id=\"keyBody\">" +
                 "<span><div class=\"key\"><img class=\"arrow\" src=\"../images/arrow.svg\"></div> Moves result selector up the page.</span>" +
                 "<span><div class=\"key\"><img class=\"arrow down\" src=\"../images/arrow.svg\"></div> Moves result selector down the page.</span>" +
                 "<span><div class=\"key\"><img class=\"arrow\" src=\"../images/arrow.svg\"></div><em class=\"small\">or</em><div class=\"key\"><img class=\"arrow down\" src=\"../images/arrow.svg\"></div> With result selector off screen, this selects the middle result within view.</span>" +
                 "<span><div class=\"key text\"><em class=\"small\">Enter</em></div> Follow the result link and visit the project's homepage.</span>" +
                 "<span><div class=\"key text\"><em class=\"small\">Esc</em></div> Scrolls to and selects the search input, press it again to clear the input.</span>" +
                 "</div>" +
                 "</div>",
        overlayStyles: {
          backgroundColor: "#4C5859",
          opacity: .9
        },
        modalStyles: {
          left: "0px",
          top: "111px",
          height: "50px",
          width: "100%",
          padding: "0px",
          margin: "0px",
          borderRadius: "5px",
          backgroundColor: "transparent"
        },
        closeStyles: {
          right: "20%",
          display: "block"
        },
        closeButton: false
      });

      modal.onClose(function () {
        input.focus();
      });


    }

  // Escape
  } else if (event.keyCode === 27) {
    event.stopImmediatePropagation();
    event.preventDefault();

    input.blur();

    curSel = document.getElementById("selected");

    // do we have a selection or have we scrolled?
    if (curSel) {
      curSel.removeAttribute('id');
      input.focus();
      input.select();
    } else if (window.pageYOffset > 0) {
      input.focus();
      input.select();
    } else {
      input.value = '';
      input.select();
      history.pushState({}, 'Search:', '/?q=');
      return false;
    }

    // return to the top of page
    // done last intentionally
    window.scroll(window.pageXOffset, 0);
  }
};
