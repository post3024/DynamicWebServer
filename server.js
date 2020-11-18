// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');

let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

let app = express();
let port = 8000;

// open usenergy.sqlite3 database
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

// create static list of the states to use later
let stateListSql = 'SELECT state_abbreviation FROM States';
let stateArr = [];
Promise.all([dbQueryPromise(stateListSql)]).then((results) => {
    for(i = 0; i < results[0].length; i++) {
        stateArr.push(results[0][i].state_abbreviation);
    }
});

app.use(express.static(public_dir)); // serve static files from 'public' directory

// promise function that reads a file and resolves the string html template
function readFilePromise(filename) {
    return new Promise ((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, template) => {
            if(err){
                reject(err);
            }
            else{
                resolve(template);
            }
        });
    });
}

// promise function that sends a query to the database and resolves the array of rows returned
function dbQueryPromise(sql) {
    return new Promise ((resolve, reject) => {
        db.all(sql, (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                resolve(rows);
            }
        });
    });
}


// GET request handler for home page '/' (redirect to /year/2018)
app.get('/', (req, res) => {
    let yearDataQuery = "SELECT * FROM Consumption WHERE year = 2018";
    Promise.all([readFilePromise(path.join(template_dir, 'year.html')), dbQueryPromise(yearDataQuery)]).then((results) => {
        // set promise resolves to the appropriate variables
        let template = results[0];
        let yearDataRows = results[1];

        let year = 2018;

        var coalTotal       = 0;
        var naturalGasTotal = 0;
        var nuclearTotal    = 0;
        var petroleumTotal  = 0;
        var renewableTotal  = 0;

        let dataTable = '';

        for(i = 0; i < yearDataRows.length; i++) {
            // adds row of data to the final string
            dataTable = dataTable + addNewRowForYear(yearDataRows[i]);

            //adds to the total
            coalTotal       = coalTotal+yearDataRows[i].coal;
            naturalGasTotal = naturalGasTotal+yearDataRows[i].natural_gas;
            nuclearTotal    = nuclearTotal+yearDataRows[i].nuclear;
            petroleumTotal  = petroleumTotal+yearDataRows[i].petroleum;
            renewableTotal  = renewableTotal+yearDataRows[i].renewable;
        }

        // dynamically set the state name and the table to show the specified data
        template = template.replace('YEAR', year);
        template = template.replace('DATA', dataTable);

        // set the javascript variables in year.html
        template = template.replace('var year', 'var year = ' + year);
        template = template.replace('var coal_count', 'var coal_count = ' + coalTotal);
        template = template.replace('var natural_gas_count', 'var natural_gas_count = ' + naturalGasTotal);
        template = template.replace('var nuclear_count', 'var nuclear_count = ' + nuclearTotal );
        template = template.replace('var petroleum_count', 'var petroleum_count = ' + petroleumTotal);
        template = template.replace('var renewable_count', 'var renewable_count = ' + renewableTotal);

        // send final edited template to browser
        res.status(200).send(template);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    if(req.params.selected_year < 1960 || req.params.selected_year > 2018) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.write('Error: no data for year ' + req.params.selected_year);
        res.end();
    }
    else{
        let yearDataQuery = 'SELECT * FROM Consumption WHERE year = ' + req.params.selected_year;
    
        Promise.all([readFilePromise(path.join(template_dir, 'year.html')), dbQueryPromise(yearDataQuery)]).then((results) => {
            // set promise resolves to the appropriate variables
            let template = results[0];
            let yearDataRows = results[1];

            let year = req.params.selected_year;

            // Find the previous and next year
            let previousYear = parseInt(parseInt(year)-1);
            let nextYear = parseInt(parseInt(year)+1);
            if (year==1960) {
                previousYear = 2018;
            }
            else if (year==2018) {
                nextYear = 1960;
            }

            previousYear = '/year/' + previousYear;
            nextYear = '/year/' + nextYear;

            let dataTable = '';

            var coalTotal       = 0;
            var naturalGasTotal = 0;
            var nuclearTotal    = 0;
            var petroleumTotal  = 0;
            var renewableTotal  = 0;

            for(i = 0; i < yearDataRows.length; i++) {
                // adds row of data to the final string
                dataTable = dataTable + addNewRowForYear(yearDataRows[i]);

                //adds to the total
                coalTotal       = coalTotal+yearDataRows[i].coal;
                naturalGasTotal = naturalGasTotal+yearDataRows[i].natural_gas;
                nuclearTotal    = nuclearTotal+yearDataRows[i].nuclear;
                petroleumTotal  = petroleumTotal+yearDataRows[i].petroleum;
                renewableTotal  = renewableTotal+yearDataRows[i].renewable;
            }

            // dynamically set the year and the table to show the specified data
            template = template.replace('YEAR', year);
            template = template.replace('DATA', dataTable);

            // set the previous and next links
            template = template.replace('previousLink', previousYear);
            template = template.replace('nextLink', nextYear);

            /*//Button Features
            var currentYear = parseInt(year);
            var previousYear = currentYear - 1;
            var nextYear = currentYear + 1;
            if (currentYear == 1960) {
                previousYear = 2018;
            }
            else if (currentYear == 2018) {
                nextYear = 1960;
            }
            var previousYearButton = "href=\"/year/" + previousYear + "\">"+previousYear;
            var nextYearButton = "href=\"/year/" + nextYear + "\">"+nextYear
            response = response.replace("href=\"\">Prev", previousYearButton);
            response = response.replace("href=\"\">Next", nextYearButton);
            WriteHtml(res, response);*/

            // set the javascript variables in year.html
            template = template.replace('var year', 'var year = ' + year);
            template = template.replace('var coal_count', 'var coal_count = ' + coalTotal);
            template = template.replace('var natural_gas_count', 'var natural_gas_count = ' + naturalGasTotal);
            template = template.replace('var nuclear_count', 'var nuclear_count = ' + nuclearTotal );
            template = template.replace('var petroleum_count', 'var petroleum_count = ' + petroleumTotal);
            template = template.replace('var renewable_count', 'var renewable_count = ' + renewableTotal);

            // send final edited template to browser
            res.status(200).send(template);
        }).catch((err) => {
            Write404Error(res);
        });
    }
    
});

// string concatenation function that adds the row to the html
function addNewRowForYear(row) {
    let result = '';

    let total = row.coal + row.natural_gas + row.nuclear + row.petroleum + row.renewable;

    result = result + '<tr>';
    result = result + '<td>' + row.state_abbreviation + "</td>";
    result = result + '<td>' + row.coal + "</td>";
    result = result + '<td>' + row.natural_gas + "</td>";
    result = result + '<td>' + row.nuclear + "</td>";
    result = result + '<td>' + row.petroleum + "</td>";
    result = result + '<td>' + row.renewable + "</td>";
    result = result + '<td>' + total + "</td>";
    result = result + '</tr>';

    return result;
}

// string concatenation function that adds the row to the html
function addNewRowForState(row) {
    let result = '';

    let total = row.coal + row.natural_gas + row.nuclear + row.petroleum + row.renewable;

    result = result + '<tr>';
    result = result + '<td>' + row.year + "</td>";
    result = result + '<td>' + row.coal + "</td>";
    result = result + '<td>' + row.natural_gas + "</td>";
    result = result + '<td>' + row.nuclear + "</td>";
    result = result + '<td>' + row.petroleum + "</td>";
    result = result + '<td>' + row.renewable + "</td>";
    result = result + '<td>' + total + "</td>";
    result = result + '</tr>';

    return result;
}

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    let stateNameQuery = 'SELECT state_name FROM States WHERE state_abbreviation=\'' + req.params.selected_state + '\'';
    let stateDataQuery = 'SELECT * FROM Consumption WHERE state_abbreviation=\'' + req.params.selected_state + '\'';

    Promise.all([readFilePromise(path.join(template_dir, 'state.html')), dbQueryPromise(stateNameQuery), dbQueryPromise(stateDataQuery)]).then((results) => {
        // set promise resolves to the appropriate variables
        let template = results[0];
        let stateNameRows = results[1];
        let stateDataRows = results[2];

        if (stateNameRows.length == 0) {
            res.status(404).send('Error: no data for state ' + req.params.selected_state);
        }
        else {
            let stateName = stateNameRows[0].state_name;

            // Find the previous and next states alphabetically
            let stateIndex = stateArr.indexOf(req.params.selected_state);
            let previousState;
            let nextState;
            if (stateIndex == 0) {
                previousState = stateArr[stateArr.length - 1];
                nextState = stateArr[stateIndex + 1];
            }
            else if (stateIndex == stateArr.length - 1) {
                previousState = stateArr[stateIndex - 1];
                nextState = stateArr[0];
            }
            else {
                previousState = stateArr[stateIndex - 1];
                nextState = stateArr[stateIndex + 1];
            }

            previousState = '/state/' + previousState;
            nextState = '/state/' + nextState;

            let coal_counts = [];
            let natural_gas_counts =[];
            let nuclear_counts = [];
            let petroleum_counts = [];
            let renewable_counts = [];

            let dataTable = '';

            for(i = 0; i < stateDataRows.length; i++) {
                // adds row of data to the final string
                dataTable = dataTable + addNewRowForState(stateDataRows[i]);

                // adds to the array variables
                coal_counts.push(stateDataRows[i].coal);
                natural_gas_counts.push(stateDataRows[i].natural_gas);
                nuclear_counts.push(stateDataRows[i].nuclear);
                petroleum_counts.push(stateDataRows[i].petroleum);
                renewable_counts.push(stateDataRows[i].renewable);
            }

            // dynamically set the state name and the table to show the specified data
            template = template.replace('STATE', stateName);
            template = template.replace('DATA', dataTable);

            // set the previous and next links
            template = template.replace('previousLink', previousState);
            template = template.replace('nextLink', nextState);

            // set image dynamically
            template = template.replace('stateAbbreviation', req.params.selected_state);

            // set the javascript variables in state.html
            template = template.replace('var state', 'var state = "' + stateName + '"');
            template = template.replace('var coal_counts', 'var coal_counts = [' + coal_counts + ']');
            template = template.replace('var natural_gas_counts', 'var natural_gas_counts = [' + natural_gas_counts + ']');
            template = template.replace('var nuclear_counts', 'var nuclear_counts = [' + nuclear_counts + ']');
            template = template.replace('var petroleum_counts', 'var petroleum_counts = [' + petroleum_counts + ']');
            template = template.replace('var renewable_counts', 'var renewable_counts = [' + renewable_counts + ']');

            // send final edited template to browser
            res.status(200).send(template);
        }
    }).catch(error => { 
        console.error(error.message);
    });
});

// GET request handler for '/energy/*'
app.get('/energy/:selected_energy_source', (req, res) => {
    // this will require a query to the SQL database
    let energyOptions = {coal: 'Coal', natural_gas: 'Natural Gas', nuclear: 'Nuclear', petroleum: 'Petroleum', renewable: 'Renewable'};
    let energy_type = req.params.selected_energy_source.toLowerCase();
    if (energyOptions.hasOwnProperty(energy_type) == false) {
        res.status(404).send("ERROR 404 \n\n " + energy_type + "is not a valid energy source"); 
    } else {
        let energyTypeQuery = "SELECT year, state_abbreviation, " + req.params.selected_energy_source + " FROM Consumption ORDER BY year, state_abbreviation";
        let rownamesQuery = "SELECT state_abbreviation FROM States ORDER BY state_abbreviation";

        Promise.all([readFilePromise(path.join(template_dir, 'energy.html')), dbQueryPromise(rownamesQuery), dbQueryPromise(energyTypeQuery)]).then((results) => {
            // set promise resolves to the appropriate variables
            let template = results[0];
            let columns = results[1];
            let energyTypeData = results[2];

            let energy_counts = {};
            //DYNAMICALLY CREATE ALL COLUMN HEADERS
            let columnheaders = '';
            for(i = 0; i < columns.length; i++) {
                energy_counts[columns[i].state_abbreviation] = [];
                columnheaders = columnheaders +  '<th>' + columns[i].state_abbreviation + "</th>";            
            };
        
            //DYNAMICALLY FILL THE TABLE
            let dataTable = '';
            let year = 1900; //any number that's not 1960
            for(i = 0; i < energyTypeData.length; i++) {
                energy_counts[energyTypeData[i].state_abbreviation].push(energyTypeData[i][energy_type]);
                if(i==0){                                    //first row
                    dataTable = `${dataTable}<tr><th>${energyTypeData[i].year}</th><td>${energyTypeData[i][energy_type]}</td>` ;
                    year = energyTypeData[i].year;
                } else if (i == energyTypeData.length-1){    //end last row
                dataTable = `${dataTable}<td>${energyTypeData[i][energy_type]}</td></tr>`;
                } else if (energyTypeData[i].year != year) { //every new row
                    dataTable = `${dataTable}</tr><tr><th>${energyTypeData[i].year}</th><td>${energyTypeData[i][energy_type]}</td>`;
                    year = energyTypeData[i].year;
                } else if(energyTypeData[i].year == year) { //the rest of the data
                    dataTable = `${dataTable}<td>${energyTypeData[i][energy_type]}</td>`;
                };
            };



            //Previous and Next buttons
            let typeArr = Object.keys(energyOptions);
            let typeIndex = typeArr.indexOf(energy_type);
            let previousType;
            let nextType;
            if (typeIndex == 0) {
                previousType = typeArr[typeArr.length - 1];
                nextType = typeArr[typeIndex + 1];
            }
            else if (typeIndex == typeArr.length - 1) {
                previousType = typeArr[typeIndex - 1];
                nextType = typeArr[0];
            }
            else {
                previousType = typeArr[typeIndex - 1];
                nextType = typeArr[typeIndex + 1];
            }

            previousType = '/energy/' + previousType;
            nextType = '/energy/' + nextType;
            //Image Population
            let imgString = 'src="../images/' + energy_type +'.jpg" alt="image of ' + energyOptions[energy_type] + '"';
            template = template.replace('IMAGE', imgString);
            
            // set the previous and next links
            template = template.replace('previousLink', previousType);
            template = template.replace('nextLink', nextType);

            // fill the html file
            template = template.replace('TYPEHERE', energyOptions[energy_type]);
            template = template.replace('STATES', columnheaders);
            template = template.replace('DATA', dataTable);

            // replace the variables
            template = template.replace('var energy_type', 'var energy_type = "' + energyOptions[energy_type] + '"');
            template = template.replace('var energy_counts', "var energy_counts = " + JSON.stringify(energy_counts));
            res.status(200).send(template);
        });
    };
});


app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
