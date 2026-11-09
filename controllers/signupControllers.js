const mysql = require('mysql2/promise');
const validator = require('validator');
const argon = require('argon2');

//@desc page for creating user account
//@route GET /signup
//@access public

const signupPage = (req, res) => {
	res.render('signup', {notice: 'Ootan andmeid!'});
};

//@desc page for creating user account
//@route POST /signup
//@access public

const signupPagePost = async (req, res) => {
	let conn;
	let notice = '';
	//puhastame andmeid ja valideerime (kontrollime)
	const firstName = validator.escape(req.body.firstNameInput.trim());
	const lastName = validator.escape(req.body.lastNameInput.trim());
	const birthDate = req.body.birthDateInput;
	const gender = req.body.genderInput;
	const email = req.body.emailInput.trim();
	const password = req.body.passwordInput;
	const confirmPassword = req.body.confirmPasswordInput;
	
	//kontrollime, kas kõik on olemas
	if(!firstName || !lastName || !birthDate || !gender || !email || !password || !confirmPassword){
		notice = 'Andmeid on puudu!';
		return res.render('signup', {notice: notice});
	}
	
	//kas on e-mail korrektne
	if(!validator.isEmail(email)){
		notice = 'Meiliaadress pole korrektne!';
		return res.render('signup', {notice: notice});
	}
	
	//kas sünnipäev on korrektne
	if(!validator.isDate(birthDate) || validator.isAfter(birthDate)){
		notice = 'Sisestatud sünnikuupäev pole korrektne!';
		return res.render('signup', {notice: notice});
	}
	
	//kas parool on piisavalt tugev
	const passwordOptions = {minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0};
	if(!validator.isStrongPassword(password, passwordOptions)){
		notice = 'Sisestatud parool pole piisavalt tugev!';
		return res.render('signup', {notice: notice});
	}
	//kas kaks  tükki on ühesugused
	if(password != confirmPassword){
		notice = 'Sisestatud paroolid ei kattu!';
		return res.render('signup', {notice: notice});
	}
	
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME
		});
		let sqlReq = 'SELECT id FROM users WHERE email = ?';
		const [users] = await conn.execute(sqlReq, [email]);
		if (users.length > 0){
			notice = 'Selline kasutaja on juba olemas!';
			return res.render('signup', {notice: notice});
		}
		//kui pole olemas, siis salvestame
		sqlReq = 'INSERT INTO users (firstname, lastname, birthdate, gender, email, password) VALUES (?,?,?,?,?,?)';
		//krüpteerime parool
		const pwdHash = await argon.hash(password);
		const [result] = await conn.execute(sqlReq, [
			firstName,
			lastName,
			birthDate,
			gender,
			email,
			pwdHash
		]);
		notice = 'Loodi kasutajakonto!';
		res.render('signup', {notice: notice});
	}
	catch (err) {
		console.log('Viga: ' + err);
		res.render('signup', {notice: 'Ootan andmeid!'});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
};

module.exports = {
	signupPage,
	signupPagePost
}