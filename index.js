const express = require('express');
const fs = require('fs').promises;
//moodul URL-i lahtiharutamiseks, et saaks POST osad ka kätte
const bodyparser = require('body-parser');
//moodul andmebaasiga suhtlemiseks, promises osaga async programmeerimise jaoks
const mysql = require('mysql2/promise');
//moodul .env faili lugemiseks, keskkonnamuutujate parsimiseks
require('dotenv').config();
const dateET = require('./src/dateTimeET');

const textRef = 'public/txt/vanasonad.txt';
const regTextRef = 'public/txt/visits.txt';

//käivitan expess.js funktsiooni ja annan nimeks "app"
const app = express();
//määrame veebilehtedele mallide renderdamise mootori
app.set('view engine', 'ejs');
//määran ühe päris kataloogi virtuaalses serveris kättesaadavaks
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

//loon andmebaasiühenduse
/* const conn = mysql.createConnection({
	host: 'localhost',
	user: 'if26',
	password: 'ifikas26',
	database: 'if26_inga_petuhhov_TA'
}); */

//marsruudid
app.get('/', (req, res)=>{
	//res.send('Express.js läks käima ja serveerib meile veebi.');
	const dayNow = dateET.day();
	const dateNow = dateET.fullDate(0);
	const timeNow = dateET.fullTime();
	res.render('index', {dayNow: dayNow, dateNow: dateNow, timeNow: timeNow});
});

app.get('/vanasona', async (req, res)=>{
	console.log('Päringu sisu on: ' + req.body);
	try {
		const data = await fs.readFile(textRef, "utf8");
		let folkWisdom = data.split(";");
		res.render('vanasona', {wisdom: folkWisdom[Math.round(Math.random() * (folkWisdom.length - 1))]});
	}
	catch (err) {
		console.log(err);
		res.render('vanasona', {wisdom: 'Ei leidnud ühtegi vanasõna!'});
	}
});

app.get('/regvisit', (req, res)=>{
	res.render('regvisit');
});

app.post('/regvisit', async (req, res)=>{
	try {
		await fs.open(regTextRef, 'a');
		await fs.appendFile(regTextRef, req.body.nameInput + ';');
		res.render('regvisit');
	}
	catch (err){
		console.log(err);
		res.render('regvisit');
	}
});

app.get('/eestifilm', (req,res)=>{
	res.render('eestifilm');
});

app.get('/eestifilm/inimesed', async (req,res)=>{
	//console.log('Andmebaasiserver on: ' + process.env.DB_HOST);
	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: 'if26_inga_petuhhov_TA'
		});
		const sqlReq = 'SELECT * FROM person ORDER by last_name';
		const [sqlRes] = await conn.execute(sqlReq);
		console.log(sqlRes);
		res.render('eestifilminimesed', {personList: sqlRes});
	}
	catch (err){
		console.log('Viga andmebaasist lugemisel: ' + err);
		res.render('eestifilmiinimesed', {personList: []});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
});

app.get('/eestifilm/inimesed_add', (req, res)=>{
	res.render('eestifilmiinimesed_add', {notice: 'Ootan sisestust!'});
});

app.post('/eestifilm/inimesed_add', async (req, res)=>{
	console.log(req.body);
	//kontrollime andmete olemasolu
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.bornInput || req.body.bornInput >= new Date()){
		console.log('Andmed pole korrektsed');
		return res.render('eestifilmiinimesed_add', {notice: 'Andmed on puudulikud!'});
	}
	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: 'if26_inga_petuhhov_TA'
		});
		let sqlReq = 'INSERT INTO person (first_name, last_name, born, deceased) VALUES (?,?,?,?)';
		let deceacedDate = null;
		if(req.body.deceasedInput !=''){
			deceacedDate = req.body.deceasedInput;
		}
		await conn.execute(sqlReq, [
			req.body.firstNameInput,
			req.body.lastNameInput,
			req.body.bornInput,
			deceacedDate
		]);
		res.render('eestifilmiinimesed_add', {notice: 'Andmed salvestati! Ootan uut sisestust!'});
	}
	catch (err) {
		console.log('Viga andmebaasiga suhtlemisel: ' + err);
		res.render('eestifilmiinimesed_add', {notice: 'Tekkis viga, andmeid ei salvestatud!'});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
});

app.listen(5100);