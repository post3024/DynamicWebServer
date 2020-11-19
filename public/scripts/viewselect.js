function Init() {
    ChangedSearchType();
}

function ChangedSearchType(){
    var view_type = document.getElementById('view_type');
    var view_value = document.getElementById('view_value');
    RemoveAllChildren(view_value);
    if (view_type.value === 'year') {
        PopulateYears();
    }
    else if (view_type.value === 'state') {
        PopulateStates();
    }
    else {
        PopulateEnergyType();
    }
}

function SubmitView() {
    var view_type = document.getElementById('view_type');
    var view_value = document.getElementById('view_value');
    if (view_value.value != 'Select') {
        window.location = '/' + view_type.value + '/' + view_value.value;
    }
}

function RemoveAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function PopulateYears() {
    var view_value = document.getElementById('view_value');
    let selectOption = document.createElement('option');
    selectOption.value = 'Select';
    selectOption.textContent = 'Select';
    view_value.appendChild(selectOption);
    for (let i = 1960; i <= 2018; i++) {
        let option = document.createElement('option');
        option.value = i.toString();
        option.textContent = i.toString();
        view_value.appendChild(option);
    }
}

function PopulateStates() {
    var view_value = document.getElementById('view_value');
    for (let i = 0; i < states.length; i++) {
        let option = document.createElement('option');
        option.value = states[i];
        option.textContent = states[i];
        view_value.appendChild(option);
    }
}

function PopulateEnergyType() {
    var view_value = document.getElementById('view_value');
    let selectOption = document.createElement('option');
    selectOption.value = 'Select';
    selectOption.textContent = 'Select';
    view_value.appendChild(selectOption);
    for (let key in energy_types) {
        let option = document.createElement('option');
        option.value = key;
        option.textContent = energy_types[key];
        view_value.appendChild(option);
    }
}

var states = ['Select', 'AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME',
    'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA',
    'VT', 'WA', 'WI', 'WV', 'WY'];

var energy_types = {
    coal: 'Coal',
    natural_gas: 'Natural Gas',
    nuclear: 'Nuclear',
    petroleum: 'Petroleum',
    renewable: 'Renewable'
};