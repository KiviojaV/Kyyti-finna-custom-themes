class TilatSuodatin {
    constructor(containerId, filters, cityId, roomDataFile = "rooms.json") {
        this.containerId = containerId;
        this.roomDataFile = roomDataFile;
        this.cityId = cityId;
        this.rooms = [];
        this.contactInfo = {};
        this.container = document.getElementById(`${containerId}-roomsContainer`);
        this.filterElements = filters.map(id => document.getElementById(`${containerId}-${id}`));
        this.resetButton = document.getElementById(`${containerId}-resetFilters`);
        this.filters = { access: '', price: '', library: '', purpose: '' };
        this.init();
    }

    // Ladataan tilojen tiedot JSON:sta Finnasta
    async loadRooms() {
        try {
            const response = await fetch(`https://kyyti.finna-pre.fi/themes/custom/files/Tilat/${this.roomDataFile}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.rooms = await response.json();
        } catch (error) {
            console.error('Tilojen lataaminen epäonnistui:', error);
        }
    }

    // Haetaan yhteystiedot Kirkannasta
    async getContactInfo() {
        try {
            const baseUrl = 'https://api.kirjastot.fi/v4/library';
            const params = new URLSearchParams({
                lang: 'fin',
                city: this.cityId,
            });
            params.append('with[]', 'emailAddresses');
            params.append('with[]', 'mailAddress');
            params.append('with[]', 'phoneNumbers');

            const url = `${baseUrl}?${params.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.contactInfo = data.items.reduce((acc, library) => {
                acc[library.name] = library;
                return acc;
            }, {});
        } catch (error) {
            console.error('Yhteystietojen hakeminen epäonnistui:', error);
        }
    }

    // Alustetaan select-elementit Tiladatasta löytyvillä hintatiedoilla, käyttötarkoituksilla ja kirjastoilla
    initSelects() {
        const prices = [...new Set(this.rooms.map(r => r.price))];
        const purposes = [...new Set(this.rooms.flatMap(r => r.purposes))];
        const libraries = [...new Set(this.rooms.map(r => r.library))];

        this.fillSelect(document.getElementById(`${this.containerId}-priceFilter`), prices);
        this.fillSelect(document.getElementById(`${this.containerId}-purposeFilter`), purposes);
        this.fillSelect(document.getElementById(`${this.containerId}-libraryFilter`), libraries);
    }

    fillSelect(select, options) {
        select.innerHTML = '<option value="">Kaikki</option>' +
            options.sort().map(opt => `<option value="${opt}">${opt}</option>`).join('');
    }

    toggleResetButton() {
        const anyFilterActive = Object.values(this.filters).some(val => val !== '');
        this.resetButton.style.display = anyFilterActive ? 'inline-block' : 'none';
    }

    async init() {
        // Lisää eventit suodattimille
        await this.loadRooms();
        await this.getContactInfo();
        this.initSelects();

        this.filterElements.forEach(el => {
            el.addEventListener('change', (e) => {
                const key = e.target.id
                    .replace('Filter', '')
                    .replace(`${this.containerId}-`, '');
                this.filters[key] = e.target.value;
                this.toggleResetButton();
                this.renderRooms();
            });
        });

        this.resetButton.addEventListener('click', () => {
            this.filterElements.forEach(el => el.value = '');
            this.filters = { access: '', price: '', library: '', purpose: '' };
            this.toggleResetButton();
            this.renderRooms();
        });
        // Ensimmäinen renderöinti
        this.toggleResetButton();
        this.renderRooms();
    }

    findPhoneNumber(phoneNums) {
        if (phoneNums.length !== 0) {
            // Katsotaan ensin, onko kirjastolla tilavarauksiin omaa puhelinnumeroa
            const tilavarausNro = phoneNums.find((num) =>
                num.name.toLowerCase().includes("näyttelyvaraukset")
                || num.name.toLowerCase().includes("tilavaraukset"));
            if (tilavarausNro !== undefined) {
                return tilavarausNro;
            }
            // Tarkistetaan sitten asiakaspalvelun ja neuvonnan numerot
            const asiakaspalveluNro = phoneNums.find((num) =>
                num.name.toLowerCase().includes("asiakaspalvelu")
                || num.name.toLowerCase().includes("neuvonta"));
            if (asiakaspalveluNro !== undefined) {
                return asiakaspalveluNro;
            }
        }
        return "Ei puhelinnumerotietoa.";
    }

    renderRooms() {
        this.container.innerHTML = '';

        const filtered = this.rooms.filter(room => {
            return (!this.filters.access || room.reservedThrough === this.filters.access) &&
                (!this.filters.price || room.price === this.filters.price) &&
                (!this.filters.library || room.library === this.filters.library) &&
                (!this.filters.purpose || room.purposes.includes(this.filters.purpose));
        });

        if (filtered.length === 0) {
            this.container.innerHTML = '<p>Ei tuloksia valituilla rajauksilla.</p>';
            return;
        }

        filtered.sort((a, b) => {
            const libCompare = a.library.localeCompare(b.library, undefined, { sensitivity: 'base' });
            return libCompare !== 0 ? libCompare : a.name.localeCompare(b.name);
        });

        filtered.forEach(room => {
            const mainDiv = document.createElement('div');
            mainDiv.className = "row infobox";

            const imgDiv = document.createElement("div");
            imgDiv.className = "col-sm-12 col-md-6 col-lg-6";

            const infoDiv = document.createElement("div");
            infoDiv.className = "col-sm-12 col-md-6 col-lg-6";


            const varaamisTieto
                = room.reservedThrough === "Timmi"
                    ? "Voit varata tilan kirjautumalla Timmiin joko kirjastokorttisi numerolla ja tunnusluvullasi tai tunnuksilla ja salasanalla."
                    : `Ota yhteyttä ${room.library}on varataksesi tämän tilan.`;

            let phoneDiv = null;
            if (room.reservedThrough !== "Timmi") {
                let phoneNums = this.contactInfo[room.library].phoneNumbers;
                const phoneNumber = this.findPhoneNumber(phoneNums);
                phoneDiv = document.createElement("div");
                let phonenumNro = phoneNumber.number;
                const phonenumberHTML = `
                    <p>${phoneNumber.name}<br>
                    puh. <a href="tel: +358${phonenumNro.slice(1)}">${phoneNumber.number}</a></p>
                `;
                phoneDiv.innerHTML = phonenumberHTML;
            }
            const varausEle = document.createElement("p");
            varausEle.textContent = varaamisTieto;

            const priceEle = document.createElement("p");
            if (room.price === "maksuton") {
                priceEle.textContent = "Tilan varaaminen on maksutonta.";
            } else {
                const priceLink = document.createElement("a");
                priceLink.textContent = "hinnaston";
                priceLink.href = "https://kyyti.finna.fi/Content/maksut-kouvola";
                priceLink.target = "_blank";
                priceEle.appendChild(document.createTextNode('Tilan varaamisesta peritään '));
                priceEle.appendChild(priceLink);
                priceEle.appendChild(document.createTextNode(' mukainen maksu.'));
            }

            const suoralinkki = room.suoralinkki;
            const tilakuva = room.tilakuva;
            const otsikko = room.name;

            const title = document.createElement("h4");
            title.textContent = otsikko;

            const kirjastoTieto = document.createElement('h6');
            kirjastoTieto.textContent = room.library;

            const anchor = document.createElement("a");
            anchor.href = suoralinkki;
            anchor.textContent = "Siirry tilan sivulle";
            anchor.target = "_blank";
            
            const tilanKuvausEle = document.createElement("div");
            const kuvaus = document.createElement("p");
            kuvaus.textContent = room.description;
            
            const varusteet = document.createElement("p");
            varusteet.textContent = `Tilan varusteet: ${room.devices.join(', ')}`
            
            tilanKuvausEle.appendChild(kuvaus);
            tilanKuvausEle.appendChild(varusteet);

            const img = document.createElement("img");
            img.src = tilakuva;
            img.alt = "Tilan kuva";
            imgDiv.appendChild(img);

            infoDiv.appendChild(kirjastoTieto);
            infoDiv.appendChild(title);
            infoDiv.appendChild(tilanKuvausEle);
            infoDiv.appendChild(varausEle);
            if (phoneDiv && phoneDiv !== undefined) {
                infoDiv.appendChild(phoneDiv);
            }
            infoDiv.appendChild(priceEle);
            infoDiv.appendChild(anchor);

            mainDiv.appendChild(imgDiv);
            mainDiv.appendChild(infoDiv);

            this.container.appendChild(mainDiv);
        });
    }
}
