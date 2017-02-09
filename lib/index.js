import {getMemberByEmail} from './v1-api';
import {PORT} from './env';

import express from 'express';
import morgan from 'morgan';

const app = express();
app.use(morgan('dev'));

app.route('/member').get((req,res)=>{
	getMemberByEmail('claus.customer@company.com').then((output) => res.status(200).send(output.data));
});

app.listen(PORT, function (err) {
	if (err) {
		return console.error('Error starting server: ', err)
	}
	console.info('Server successfully started on port %s', PORT)
});