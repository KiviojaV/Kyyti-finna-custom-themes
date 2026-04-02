/* Add your custom template javascript here */


function finnaCustomInit() {
    
    /* Poistaa kryptisen alkuosan asiakassivun käyttäjätunnuksesta */
    $(() => {
        let $accountName = $('span.profile-title').siblings().first();
        let $newContent = $accountName.text().split('.')[1];
        $accountName.text($newContent);
    });

    /* Asettaa mobiilivälilehdistä etusivulla ensimmäisen linkin aktiiviseksi sivun latautuessa */
    $(() => {
        $(".mobiilivalilehdet li.active a").first().attr("class", "active");
    });
}

/*
Localhubin tapahtumawidgettien toimintaan vaikuttavat skriptit
*/

const waitForWidgets = function ({ searchTerms = [], numberOfWidgets = 1, language = 'fin' }) {
    const interval = setInterval(() => {
        if (typeof document.BUBSTER_WIDGETS.rendered !== 'undefined'
            && Object.keys(document.BUBSTER_WIDGETS.rendered).length === numberOfWidgets) {
            clearInterval(interval);
            handleEventlisteners({ searchTerms, language });
        }
    }, 500);
}

const handleEventlisteners = function ({ searchTerms, chosenCategory = '', language }) {
    Object.keys(document.BUBSTER_WIDGETS.rendered).forEach((widgetId) => {

        // Luo aihevalitsin
        let searchTermFilter = document.createElement('select');
        searchTermFilter.id = 'searchTermFilter';
        searchTermFilter.classList.add('bubster-search-filter');
        searchTermFilter.classList.add('search-term-filter');
        searchTermFilter.ariaLabel = "Valitse tapahtuman aihe";
        searchTermFilter.tabIndex = 0;

        // Piilotetaan hakusanavalitsin tapauksissa, joissa hakusanoja ei  olla annettu sivupohjassa
        if (!searchTerms || searchTerms.length === 0) {
            searchTermFilter.style.display = 'none';
        }

        // Lisää sivun hakutermit aihevalitsimeen
        searchTerms.forEach((value, searchTerm) => {
            let searchOption = new Option(searchTerm, value);
            searchTermFilter.appendChild(searchOption);
        })

        // Tarkista onko aiemmin valittu jokin aihe ja muuta siinä tapauksessa aihevalitsimen arvo oikeaksi
        if (chosenCategory.length !== 0) {
            searchTermFilter.value = chosenCategory;
        }
        let currentCategory = searchTermFilter.value;

        // Tarkista onko widgetissä hakupalkkkia  ja jos on, käsittele siihen kuuluvat elementit
        let widgetSearchform = document.getElementById(widgetId).querySelector('form');
        let widgetSearchPanel = widgetSearchform ? widgetSearchform.children[1] : null;

        if (widgetSearchPanel) {
            handleSearchForm({ widgetId, currentCategory, searchTerms, language });

            let searchAreaFilter = document.getElementById(widgetId).
                getElementsByClassName("bubster-search-filter bubster-search-filter-area")[0];
            handleAreaFilter({ widgetId, searchAreaFilter, currentCategory, searchTerms, language });

            widgetSearchPanel.insertBefore(searchTermFilter, searchAreaFilter);

            handleCategoryFilter({ widgetId, currentCategory, searchTerms, language });

            handleGroupFilter({ widgetId, currentCategory, searchTerms, language });

            handleEmptyButton({ widgetId, currentCategory, searchTerms, language });

            if (searchTermFilter && typeof(searchTermFilter) !== 'undefined') {
                handleSearchTermFilter({ searchTermFilter, widgetId, currentCategory, searchTerms, language });
            }
        }

        let bubsterList = document.getElementById(widgetId).getElementsByClassName('bubster-widgets-plugin bubster-css-default')[0];

        let moreButtonExists = handleMoreButton(widgetId);
        let eventCards = bubsterList.querySelectorAll('.bubster-page');
        if (eventCards && eventCards.length != 0 && !eventCards[0].classList.contains('bubster-no-content')) {
            handleEventCards(eventCards, widgetId);
        }
    });
}


const handleSearchForm = function ({ widgetId, language, searchTerms }) {
    let searchForm = document.getElementById(widgetId).querySelector('form');
    searchForm.removeAttribute('onsubmit');
    searchForm.addEventListener('submit', (event) => {
        // Estetään lomakkeen lähettämistä lataamasta sivu uudestaan
        event.preventDefault();
        async () => {
            await document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
            handleEventlisteners({ searchTerms, language });
        };
    });
}

const handleMoreButton = function (widgetId) {
    let moreBtn = document.getElementById(widgetId).getElementsByClassName("bubster-more")[0];
    if (moreBtn) {
        moreBtn.removeAttribute('onclick');
        moreBtn.addEventListener('click', document.BUBSTER_WIDGETS.rendered[widgetId].fnGetMore);
        return true;
    }
    return false;
}

const handleEmptyButton = function ({ widgetId, currentCategory, language, searchTerms }) {
    let emptyFiltersButton = document.
        getElementById(widgetId).
        getElementsByClassName(
            "bubster-search-filter bubster-search-filter-button bubster-search-filter-button-reset")[0]
    if (emptyFiltersButton) {
        emptyFiltersButton.className = 'bubster-search-filter-button-reset';
        emptyFiltersButton.removeAttribute('onclick');
        emptyFiltersButton.addEventListener('click', () => {
            document.BUBSTER_WIDGETS.rendered[widgetId].fnEmptySearch();
            currentCategory = '';
            const interval = setInterval(() => {
                if (document.getElementById(widgetId).
                    getElementsByClassName("bubster-search-filter bubster-search-filter-area")[0].
                    hasAttribute('onChange')) {
                    clearInterval(interval);
                    handleEventlisteners({ searchTerms, chosenCategory: currentCategory, language });
                }
            }, 200);
        });
    }
}

const handleAreaFilter = function ({ widgetId, searchAreaFilter, currentCategory, language, searchTerms }) {

    searchAreaFilter.removeAttribute('onchange');
    searchAreaFilter.addEventListener('change', () => {
        document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
        const interval = setInterval(() => {
            if (document.getElementById(widgetId).
                getElementsByClassName("bubster-search-filter bubster-search-filter-area")[0].
                hasAttribute('onChange')) {
                clearInterval(interval);
                handleEventlisteners({ searchTerms, chosenCategory: currentCategory, language });
            }
        }, 200);
    });
}

const handleGroupFilter = function ({ widgetId, currentCategory, language, searchTerms }) {
    let searchGroupFilter = document.getElementById(widgetId).
        getElementsByClassName("bubster-search-filter bubster-search-filter-age")[0];
    if (searchGroupFilter) {
        searchGroupFilter.ariaLabel = language === "eng" ? "Choose event target group" : "Valitse tapahtuman kohderyhmä";
        searchGroupFilter.options[1].textContent = language === "eng" ? "Children and youth" : "Lapset ja nuoret";
        searchGroupFilter.removeAttribute('onchange');
        searchGroupFilter.addEventListener('change', () => {
            document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
            const interval = setInterval(() => {
                if (document.getElementById(widgetId).
                    getElementsByClassName("bubster-search-filter bubster-search-filter-age")[0].
                    hasAttribute('onChange')) {
                    clearInterval(interval);
                    handleEventlisteners({ searchTerms, chosenCategory: currentCategory, language });
                }
            }, 200);
        });
    }
}

const handleCategoryFilter = function ({ widgetId, currentCategory, language, searchTerms }) {
    let searchCategoryFilter = document.getElementById(widgetId).
        getElementsByClassName("bubster-search-filter bubster-search-filter-category")[0];
    if (searchCategoryFilter) {
        searchCategoryFilter.removeAttribute('onchange');
        searchCategoryFilter.addEventListener('change', () => {
            document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
            const interval = setInterval(() => {
                if (document.getElementById(widgetId).
                    getElementsByClassName("bubster-search-filter bubster-search-filter-category")[0].
                    hasAttribute('onChange')) {
                    clearInterval(interval);
                    handleEventlisteners({ searchTerms, chosenCategory: currentCategory, language });
                }
            }, 200);
        });
    }
}


const handleSearchTermFilter = function ({ searchTermFilter, widgetId, currentCategory, language, searchTerms }) {
    searchTermFilter.addEventListener('change', () => {
        let field = document.getElementById(widgetId).
            getElementsByClassName("bubster-search-filter bubster-search-filter-q")[0];
        field.value = searchTermFilter.value;
        document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
        currentCategory = searchTermFilter.value;
        const interval = setInterval(() => {
            if (document.getElementById(widgetId).
                querySelector('form').
                hasAttribute('onSubmit')) {
                clearInterval(interval);
                handleEventlisteners({ searchTerms, chosenCategory: currentCategory, language });
            }
        }, 200);
    });
}

const handleEventCards = function (eventCards, widgetId) {
    eventCards.forEach((card) => {
        var link = card.querySelector('a');

        link.removeAttribute('onClick');
        link.alt = 'Avaa tapahtuman tiedot ponnahdusikkunaan';

        link.addEventListener('click', (event) => {
            // Estetään linkin klikkaamisen oletuskäyttäytyminen (osoite muuttuu) ja vältetään
            // samalla monta sudenkuoppaa
            event.preventDefault();
            let cardId = card.id.split('-')[2];

            document.BUBSTER_WIDGETS.rendered[widgetId].fnOpenPageDetails(cardId);

            handleCloseButton(cardId);
        });
    });
}

const handleCloseButton = function (cardId) {
    const interval = setInterval(() => {
        let closeButton = document.getElementById(cardId).querySelector('i');
        if (closeButton) {
            clearInterval(interval);

            closeButton.removeAttribute('onClick');
            closeButton.addEventListener('click', () => {
                document.BUBSTER_WIDGETS.utils.fnClosePageDetails(cardId);
            });
        }
    }, 200);
}

/* Tietyissä tilanteissa käyttäjän on mahdollista päätyä tapahtumaponnahdusikkunaan siten, 
että inline "onClick" tapahtumakäsittelijöitä ei olla muutettu
CSP-yhteensopiviksi ja ikkunan sulkunappi ei tällöin toimi. Seuraava korjaa tilanteen */
$(() => {
    if (window.location.href.includes('#localhub-content-popup=true')) {
        let eventCardId = (window.location.href.split('&'))[2].replace('page_id=', '');
        handleCloseButton(eventCardId);
    }
});



