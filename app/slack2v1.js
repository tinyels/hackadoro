import axios from 'axios';
import {getMemberByEmail} from './v1-api';
import {SLACK_API_TOKEN} from './env';

export function getV1UserFromSlack(user_id) {
	return axios.get(`https://slack.com/api/users.info?token=${SLACK_API_TOKEN}&user=${user_id}`).then(slack=> {
		const email = slack.data.user.profile.email;
		return getMemberByEmail(email).then(v1=>{
			return v1.data[0][0]._oid;
		});
	});
}
