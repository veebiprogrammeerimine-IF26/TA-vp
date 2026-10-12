const mysql = require('mysql2/promise');

//@desc home page for Estonian Film section
//@route GET /eestifilm
//@access public

//app.get('/eestifilm', (req,res)=>{
const eestifilm = (req, res) => {
	res.render('eestifilm');
};

//@desc page for list of people involved in Estonian Film industry
//@route GET /eestifilm/inimesed
//@access public

//app.get('/eestifilm/inimesed', async (req,res)=>{
const inimesed = async (req, res) => {
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
};

//@desc page for adding people involved in Estonian Film industry
//@route GET /eestifilm/inimesed_add
//@access public

//app.get('/eestifilm/inimesed_add', (req, res)=>{
const inimesedAdd = (req, res) => {
	res.render('eestifilmiinimesed_add', {notice: 'Ootan sisestust!'});
};

//@desc page for adding people involved in Estonian Film industry
//@route POST /eestifilm/inimesed_add
//@access public

//app.post('/eestifilm/inimesed_add', async (req, res)=>{
const inimesedAddPost = async (req, res) => {
	console.log(req.body);
	//kontrollime andmete olemasolu
	//sisestatud sünnikuupäev (tekst) teisendada kuupäevaks
	const bornDate = new Date(req.body.bornInput);
	const timeNow = new Date();
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.bornInput || isNaN(bornDate.getTime()) || bornDate > timeNow){
		console.log('Andmed pole korrektsed');
		return res.render('eestifilmiinimesed_add', {notice: 'Andmed on puudulikud!'});
	}
	let deceacedDate = null;
	if(req.body.deceasedInput !=''){
		deceacedDate = req.body.deceasedInput;
	}
	if(isNaN(deceacedDate.getTime()) || deceacedDate > bornDate){
		console.log('Surmakuupäev pole päris korras');
		return res.render('eestifilmiinimesed_add', {notice: 'Surmakuupäev pole päris korras!'});
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
};

//@desc page for list Estonian Films
//@route GET /eestifilm/filmid
//@access public

//app.get('/eestifilm/filmid', async (req, res)=>{
const filmid = async (req, res) => {
	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: 'if26_inga_petuhhov_TA',
		});
		const sqlReq = 'SELECT * FROM movie ORDER BY title';
		const [sqlRes] = await conn.execute(sqlReq);
		res.render('eestifilmfilmid', {movieList: sqlRes});
	}
	catch(err){
		console.log('viga andmebaasist lugemisel: ' + err);
		res.render('eestifilmfilmid', {movieList: []});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
};

//@desc page for adding Estonian Films
//@route GET /eestifilm/filmid_add
//@access public

//app.get('/eestifilm/filmid_add', (req, res)=>{
const filmidAdd = (req, res) => {
	res.render('eestifilmfilmid_add', {notice: 'ootan sisestust', movieTitle: null, releaseYear: null, duration: null, description: null});
};

//@desc page for adding Estonian Films
//@route POST /eestifilm/filmid_add
//@access public

//app.post('/eestifilm/filmid_add', async (req, res)=>{
const filmidAddPost = async (req, res) => {
	const now = new Date();
	const year = Number(req.body.yearInput);
	const duration = Number(req.body.durationInput);

	if(!req.body.titleInput){
		return res.render('eestifilmfilmid_add', {notice: 'filmi pealkiri puudub', movieTitle: req.body.titleInput, releaseYear: req.body.yearInput, duration: req.body.durationInput, description: req.body.descriptionInput});
	}
	if(!Number.isInteger(year) || year < 1880 || year > now.getFullYear()){
		return res.render('eestifilmfilmid_add', {notice: 'valmimisaasta on vigane', movieTitle: req.body.titleInput, releaseYear: req.body.yearInput, duration: req.body.durationInput, description: req.body.descriptionInput});
	}
	if(!Number.isInteger(duration) || duration <= 0){
		return res.render('eestifilmfilmid_add', {notice: 'kestus on vigane', movieTitle: req.body.titleInput, releaseYear: req.body.yearInput, duration: req.body.durationInput, description: req.body.descriptionInput});
	}

	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: 'if26_inga_petuhhov_TA',
		});
		let sqlReq = 'INSERT INTO movie (title, release_year, duration_minutes, description) VALUES (?,?,?,?)';
		await conn.execute(sqlReq, [req.body.titleInput, year, duration, req.body.descriptionInput || null]);
		res.render('eestifilmfilmid_add', {notice: 'andmed salvestati', movieTitle: null, releaseYear: null, duration: null, description: null});
	}
	catch (err){
		console.log('viga andmebaasiga suhtlemisel: ' + err);
		res.render('eestifilmfilmid_add', {notice: 'andmebaasi suhtlus nurjus', movieTitle: req.body.titleInput, releaseYear: req.body.yearInput, duration: req.body.durationInput, description: req.body.descriptionInput});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
};

//@desc page listing professions related to film
//@route GET /eestifilm/ametid
//@access public

const ametid = async (req, res)=>{
    console.log('Andmebaasi server on: ' + process.env.DB_HOST);
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: 'if26_inga_petuhhov_TA'
        });
        const sqlReq = 'SELECT * FROM profession ORDER by id';
        const [sqlRes] = await conn.execute(sqlReq);
        console.log(sqlRes);
        res.render('eestifilmametid', {professionList: sqlRes});
    }
    catch (err){
        console.log('Viga andmebaasist lugemisel:' + err);
        res.render('eestifilmametid', {professionList: []})
    }
    finally {
        if(conn) {
            await conn.end();
        }
    }

};

//@desc page for adding professions related to film
//@route GET /eestifilm/ametid_add
//@access public

const ametidAdd = (req, res)=>{
    res.render('eestifilmametid_add', {
        notice: 'Ootan sisestust!',
        title: null,
        description: null,

    });
};

//@desc page for adding professions related to film
//@route POST /eestifilm/ametid_add
//@access public

const ametidAddPost = async (req, res) => {
    const { title, description} = req.body;

    // Abifunktsioon vormi uuesti kuvamiseks
    const showForm = (notice, clear = false) => {
        res.render('eestifilmametid_add', {
            notice: notice,
            title: clear ? null : title,
            description: clear ? null : description

        });
    };
    if (
        !title?.trim() ||
        !description?.trim()

    ) {
        return showForm('Ootan sisestust!');
    }
    let conn;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: 'if26_inga_petuhhov_TA'
        });

        const sqlReq = 'INSERT INTO profession (title, description) VALUES (?, ?)';

        await conn.execute(sqlReq, [
            title.trim(),
            description.trim()
        ]);

        // Eduka salvestamise järel tühjendame vormi
        showForm('Andmed salvestati! Ootan uut sisestust!', true);

    } catch (err) {
        console.log('Viga andmebaasiga suhtlemisel: ' + err);
        showForm('Tekkis viga, andmeid ei salvestatud!');
    } finally {
        if (conn) {
            await conn.end();
        }
    }
};


module.exports = {
	eestifilm,
	inimesed,
	inimesedAdd,
	inimesedAddPost,
	filmid,
	filmidAdd,
	filmidAddPost,
	ametid,
	ametidAdd,
	ametidAddPost
}