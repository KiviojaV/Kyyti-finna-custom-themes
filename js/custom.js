/* Add your custom template javascript here */

function finnaCustomInit() {
    $(()=>{
        let $accountName = $('span.profile-title').siblings().first();
        let $newContent =  $accountName.text().split('.')[1];
        $accountName.text($newContent);
    });
}

/* Add your custom template javascript here */


function handleEventlisteners(searchTerms,chosenCategory='') {
    Object.keys(document.BUBSTER_WIDGETS.rendered).forEach((widgetId) => {

        let searchTermFilter = document.createElement('select');
        searchTermFilter.id = 'searchTermFilter';
        searchTermFilter.classList.add('bubster-search-filter');
        searchTermFilter.classList.add('search-term-filter');
        searchTermFilter.ariaLabel = "Valitse tapahtuman aihe";
        searchTermFilter.tabIndex = 0;

        searchTerms.forEach((value,searchTerm) => {
            let searchOption = new Option(searchTerm, value);
            searchTermFilter.appendChild(searchOption);
        })
        
        if (chosenCategory.length !== 0) {
            searchTermFilter.value = chosenCategory;
        }
        let currentCategory = searchTermFilter.value;
        
        let widgetSearchPanel = document.getElementById(widgetId).querySelector('form').children[1];
                        
        if (widgetSearchPanel) {
            handleSearchForm(widgetId,currentCategory,searchTerms);
            
            handleAreaFilter(widgetId, currentCategory,searchTerms);
            
            handleSearchTermFilter(searchTermFilter,widgetId, currentCategory,searchTerms);
            widgetSearchPanel.appendChild(searchTermFilter,searchTerms);
            
            handleGroupFilter(widgetId, currentCategory,searchTerms);
            
            handleEmptyButton(widgetId, currentCategory,searchTerms);
        }
        handleMoreButton(widgetId);
    });
}

function handleSearchForm(widgetId) {
    let searchForm = document.getElementById(widgetId).querySelector('form');
    searchForm.removeAttribute('onsubmit');
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
        const interval = setInterval(() => {
            if (document.getElementById(widgetId).querySelector('form').hasAttribute('onSubmit')) {
                clearInterval(interval);
                handleEventlisteners(searchTerms,currentCategory);
            }
        }, 200);
    });
}

function handleMoreButton(widgetId) {
    let moreBtn = document.getElementById(widgetId).getElementsByClassName("bubster-more")[0];
    if (moreBtn) {
        moreBtn.removeAttribute('onclick');
        moreBtn.addEventListener('click', document.BUBSTER_WIDGETS.rendered[widgetId].fnGetMore);
    }
}

function handleEmptyButton(widgetId, currentCategory) {
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
                if (document.getElementById(widgetId).getElementsByClassName("bubster-search-filter bubster-search-filter-area")[0].hasAttribute('onChange')) {
                    clearInterval(interval);
                    handleEventlisteners(searchTerms,currentCategory);
                }
            }, 200);
        });
    }
}

function handleAreaFilter(widgetId, currentCategory) {
    let searchAreaFilter = document.getElementById(widgetId).getElementsByClassName("bubster-search-filter bubster-search-filter-area")[0];
    searchAreaFilter.removeAttribute('onchange');
    searchAreaFilter.addEventListener('change', () => {
        document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
        const interval = setInterval(() => {
            if (document.getElementById(widgetId).getElementsByClassName("bubster-search-filter bubster-search-filter-area")[0].hasAttribute('onChange')) {
                clearInterval(interval);
                handleEventlisteners(searchTerms,currentCategory);
            }
        }, 200);
    });
}

function handleGroupFilter(widgetId,currentCategory) {
    let searchGroupFilter = document.getElementById(widgetId).getElementsByClassName("bubster-search-filter bubster-search-filter-category")[0];
    if (searchGroupFilter) {
        searchGroupFilter.ariaLabel = "Valitse kohderyhmä";
        searchGroupFilter.options[0].textContent = "Valitse kohderyhmä";
        searchGroupFilter.options[1].textContent = "Lapset ja nuoret";
        searchGroupFilter.removeAttribute('onchange');
        searchGroupFilter.addEventListener('change', ()=> {
            document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
            const interval = setInterval(() => {
                if (document.getElementById(widgetId).getElementsByClassName("bubster-search-filter bubster-search-filter-category")[0].hasAttribute('onChange')) {
                    clearInterval(interval);
                    handleEventlisteners(searchTerms,currentCategory);
                }
            }, 200);
        });
    }
}

function handleSearchTermFilter(searchTermFilter, widgetId,currentCategory) {
    searchTermFilter.addEventListener('change',() => {
        let field = document.getElementById(widgetId).getElementsByClassName("bubster-search-filter bubster-search-filter-q")[0];
        field.value = searchTermFilter.value;
        document.BUBSTER_WIDGETS.rendered[widgetId].fnSearch();
        currentCategory = searchTermFilter.value;
        const interval = setInterval(() => {
            if (document.getElementById(widgetId).querySelector('form').hasAttribute('onSubmit')) {
                clearInterval(interval);
                handleEventlisteners(searchTerms,currentCategory);
            }
        }, 200);
    });
}

function waitForWidgets(searchTerms,numberOfWidgets=1) {
    const interval = setInterval(() => {
        if (typeof document.BUBSTER_WIDGETS.rendered !== 'undefined'
        && Object.keys(document.BUBSTER_WIDGETS.rendered).length === numberOfWidgets) {
            clearInterval(interval);
            handleEventlisteners(searchTerms);
        }
    }, 500);
}
