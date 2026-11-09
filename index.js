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
app.use(bodyparser.urlencoded({extended: true}));//kui vormidest ainult tekst, siis "false"

//marsruudid
app.get('/', async (req, res)=>{
	//res.send('Express.js läks käima ja serveerib meile veebi.');
	const dayNow = dateET.day();
	const dateNow = dateET.fullDate(0);
	const timeNow = dateET.fullTime();
	let conn;
	try {
		let sqlReq = "SELECT filename, alttext FROM galleryphotos WHERE id=(SELECT MAX(id) FROM galleryphotos WHERE privacy=? AND deleted IS NULL)";
		const privacy = 3;
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME
		});
		const [rows, fields] = await conn.execute(sqlReq, [privacy]);
		let imgAlt = "Avalik foto";
		if(rows[0].alttext != ""){
			imgAlt = rows[0].alttext;
		}
		res.render('index', {dayNow: dayNow, dateNow: dateNow, timeNow: timeNow, imgFile: process.env.GALLERY_NORMAL + rows[0].filename, imgAlt: imgAlt});
	}
	catch (err) {
		console.log(err);
		res.render('index', {dayNow: dayNow, dateNow: dateNow, timeNow: timeNow, imgFile: 'pic/vp_logo_small.png', imgAlt: 'VP logo'});
	}
	finally {
		if(conn){
			await conn.end();
			//console.log("Andmebaasiühendus suletud!");
		}
	}
});

//sisseloginud kasutajate avaleht
app.get('/home', (req, res)=>{
	res.render('home');
});

//väljalogimine
app.get('/logout', (req, res)=>{
	res.redirect('/');
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

//Eesti filmi marsruudid
const eestifilmRouter = require('./routes/eestifilmRoutes');
app.use('/eestifilm', eestifilmRouter);

//galeriipiltide üleslaadimine
const galleryPhotoUploadRouter = require('./routes/galleryPhotoUploadRoutes');
app.use('/galleryPhotoUpload', galleryPhotoUploadRouter);

const galleryRouter = require('./routes/galleryRoutes');
app.use('/gallery', galleryRouter);

//kasutajakonto loomise marsruut
const signupRouter = require('./routes/signupRoutes');
app.use('/signup', signupRouter);

//Sisselogimise marsruut
const signinRouter = require('./routes/signinRoutes');
app.use('/signin', signinRouter);

app.listen(5100);