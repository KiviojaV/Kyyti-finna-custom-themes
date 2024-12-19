/* Add your custom template javascript here */

/* Poistaa kryptisen alkuosan asiakassivun käyttäjätunnuksesta */
function finnaCustomInit() {
    $(() => {
        let $accountName = $('span.profile-title').siblings().first();
        let $newContent = $accountName.text().split('.')[1];
        $accountName.text($newContent);
    });
}

/*
Localhubin tapahtumawidgettien toimintaan vaikuttavat skriptit
*/
const waitForWidgets = function (searchTerms, numberOfWidgets = 1) {
    const interval = setInterval(() => {
        if (typeof document.BUBSTER_WIDGETS.rendered !== 'undefined'
            && Object.keys(document.BUBSTER_WIDGETS.rendered).length === numberOfWidgets) {
            clearInterval(interval);
            handleEventlisteners(searchTerms);
        }
    }, 500);
}

const handleEventlisteners = function (searchTerms, chosenCategory = '') {
    Object.keys(document.BUBSTER_WIDGETS.rendered).forEach((widgetId) => {

        // Luo aihevalitsin
        let searchTermFilter = document.createElement('select');
        searchTermFilter.id = 'searchTermFilter';
        searchTermFilter.classList.add('bubster-search-filter');
        searchTermFilter.classList.add('search-term-filter');
        searchTermFilter.ariaLabel = "Valitse tapahtuman aihe";
        searchTermFilter.tabIndex = 0;

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
        let widgetSearchPanel = document.getElementById(widgetId).querySelector('form').children[1];

        if (widgetSearchPanel) {
            handleSearchForm(widgetId, currentCategory, searchTerms);

            let searchAreaFilter = document.getElementById(widgetId).
                                    getElementsByClassName("bubster-search-filter bubster-search-filter-area")[0];
            handleAreaFilter(widgetId, searchAreaFilter, currentCategory, searchTerms);

            handleSearchTermFilter(searchTermFilter, widgetId, currentCategory, searchTerms);

            widgetSearchPanel.insertBefore(searchTermFilter, searchAreaFilter);

            handleGroupFilter(widgetId, currentCategory, searchTerms);

            handleEmptyButton(widgetId, currentCategory, searchTerms);
        }

        const bubsterList = document.getElementById(widgetId).
                            getElementsByClassName('bubster-list-4 bubster-widgets-plugin bubster-css-default')[0].children;

        // Viimeinen elementti bubsterListissä on joko lisää-painike tai tapahtumakortti. Tarkistetaan
        // onko lisää-painiketta samalla kun se käsitellään ja päätellään näin mitkä ovat tapahtumakortteja
        let moreButtonExists = handleMoreButton(widgetId);
        let eventCards = moreButtonExists ? Array.from(bubsterList).slice(2, -1)
            : Array.from(bubsterList).slice(2);

        if (eventCards && eventCards.length != 0 && !eventCards[0].classList.contains('bubster-no-content')) {
            handleEventCards(eventCards, widgetId);
        }
    });
}


const handleSearchForm = function (widgetId) {
    let searchForm = document.getElementById(widgetId).querySelector('form');
    searchForm.removeAttribute('onsubmit');
    searchForm.addEventListener('submit', (event) => {
        // Estetään lomakkeen lähettämistä lataamasta sivu uudestaan
        event.preventDefault();
        async () => {
            await document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
            handleEventlisteners(searchTerms, currentCategory);
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

const handleEmptyButton = function (widgetId, currentCategory) {
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
                    handleEventlisteners(searchTerms, currentCategory);
                }
            }, 200);
        });
    }
}

const handleAreaFilter = function (widgetId, searchAreaFilter, currentCategory) {

    searchAreaFilter.removeAttribute('onchange');
    searchAreaFilter.addEventListener('change', () => {
        document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
        const interval = setInterval(() => {
            if (document.getElementById(widgetId).
                getElementsByClassName("bubster-search-filter bubster-search-filter-area")[0].
                    hasAttribute('onChange')) {
                clearInterval(interval);
                handleEventlisteners(searchTerms, currentCategory);
            }
        }, 200);
    });
}

const handleGroupFilter = function (widgetId, currentCategory) {
    let searchGroupFilter = document.getElementById(widgetId).
                            getElementsByClassName("bubster-search-filter bubster-search-filter-category")[0];
    if (searchGroupFilter) {
        searchGroupFilter.ariaLabel = "Valitse tapahtuman kohderyhmä";
        searchGroupFilter.options[0].textContent = "Valitse kohderyhmä";
        searchGroupFilter.options[1].textContent = "Lapset ja nuoret";
        searchGroupFilter.removeAttribute('onchange');
        searchGroupFilter.addEventListener('change', () => {
            document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
            const interval = setInterval(() => {
                if (document.getElementById(widgetId).
                    getElementsByClassName("bubster-search-filter bubster-search-filter-category")[0].
                        hasAttribute('onChange')) {
                    clearInterval(interval);
                    handleEventlisteners(searchTerms, currentCategory);
                }
            }, 200);
        });
    }
}

const handleSearchTermFilter = function (searchTermFilter, widgetId, currentCategory) {
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
                handleEventlisteners(searchTerms, currentCategory);
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
