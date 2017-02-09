import {getMemberByEmail,getWorkItemByNumber,getMyWork} from './v1-api';
import {transformToPomodoneJson} from './pomodone';
import {default as pomo} from './pomo-slack';
import {VERIFY_TOKEN, PORT} from './env';

import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser'

const app = express();
app.use(morgan('dev'));
app.route('/pomo')
	.get((req, res) =>{
		res.sendStatus(200)
	})
	.post(bodyParser.urlencoded({ extended: true }), function (req, res) {
		if (req.body.token !== VERIFY_TOKEN) {
			return res.sendStatus(401)
		}

		res.json( pomo(req.body))
	});

app.route('/member').get((req,res)=>{
	getMemberByEmail('claus.customer@company.com').then((output) => res.status(200).send(output.data));
});

app.route('/workitem').get((req,res)=>{
	getWorkItemByNumber('B-01004').then((result) => res.status(200).send(result.data));
});

app.route('/pomodone').get((req,res)=>{
	getMyWork().then(output =>{
		res.status(200).send(transformToPomodoneJson(output.data));
	});
});

app.listen(PORT, function (err) {
	if (err) {
		return console.error('Error starting server: ', err)
	}
	console.info('Server successfully started on port %s', PORT)
});