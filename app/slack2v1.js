import axios from 'axios';
import {getMemberByEmail} from './v1-api';
import {SLACK_API_TOKEN} from './env';

export function getV1UserFromSlack(user_id) {
	const url = "https://slack.com/api/users.info";
	console.log("looking up user on slack", user_id);
	return axios.get(url, {params:{token:SLACK_API_TOKEN,user:user_id}}).then(slack=> {
		console.log(slack.data);
		const email = slack.data.user.profile.email;
		return getMemberByEmail(email).then(v1=>{
			return v1.data[0][0]._oid;
		})
		.catch(v1Error => console.error("v1", slackError));
	}).catch(slackError => console.error("slack", slackError));
}
