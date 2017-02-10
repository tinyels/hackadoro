import axios from 'axios';
import moment from 'moment';
import {getWorkItemByNumber, updateActual, getAssetLink, getEffort} from './v1-api';
import {getV1UserFromSlack} from './slack2v1';
import {minutes,getOptions,getCommand} from './utils';

let user_hash = {};
const DATE_FORMAT = 'YYYY-MM-DD';
const commands = {
	'start' : (opt,data) => pomo_start(data, opt),
	'stop'  : (opt,data) => pomo_stop(data, opt),
	'status': (opt,data) => pomo_status(data),
	'today': (opt, data) => get_today(data)
};

export default function(requestBody){
	const pomo_command = getCommand(requestBody.text);
	const command = commands[pomo_command];
	if (!command){
		return `unsupported pomo command ${pomo_command}`;
	}
	return command(getOptions(requestBody.text),requestBody);
}

function pomo_start(data, opt) {
	const u = start_pomo_timer(data);
	if (opt){
		const response_url = u.response_url;
		getWorkItemByNumber(opt).then((result) => {
			try {
				const workItem = result.data[0][0];
				u.workItemOid = workItem._oid;
				u.scopeOid = workItem.Scope._oid;
				u.assetLink = getAssetLink(opt);
				if (response_url) {
					axios.post(response_url, {
						text: `Pomodoro timer has been started for ${u.assetLink}. ${u.minutes} minutes remain.`,
						response_type: 'in_channel'
					});
				}
			} catch (e){
				console.log(result.data);
				console.error("could not pull off workItemOid or scopeOid", e);
			}
		});
	}
	return `Pomodoro timer has been started. ${u.minutes} minutes remain.`;
}

function pomo_stop(data){
	let u = getUser(data);

	if(u) {
		const type = u.type;
		clearTimeout(u.handle);
		u.handle = null;
		u.type = null;
		done(u);
	}
}

function pomo_status(data) {
	const u = getUser(data);
	return `user:${u.user_name}, type:${u.type}, start_time: ${u.time_start.toISOString()}, workItemOid: ${u.workItemOid}, scopeOid: ${u.scopeOid}`;
}

function getUser(data) {
	if (user_hash[data.user_id] == undefined) {
		let u = user_hash[data.user_id] = {};
		u.user_name = data.user_name;
		u.user_id = data.user_id;
	}
	return user_hash[data.user_id];
}

function start_pomo_timer(data) {
	let u = getUser(data);

	u.time_start = moment();
	u.response_url = data.response_url;

	if(u.type == "work") {
		u.type = "break";
		u.minutes = 5;
	} else {
		u.type = "work";
		u.minutes = 25 ;
	}
	u.handle = setTimeout(done(u), minutes(u.minutes));
	return u;
}

function workComplete(data) {
	return data.type === "work" && data.scopeOid && data.workItemOid;
}

function done(user){
	return ()=> {
		const response_url = user.response_url;
		const assetLink = user.assetLink;
		if (response_url) {
			console.info(`ending pomo by sending a message to ${response_url}`);
			const message = workComplete(user)? `Pomo timer complete for @${user.user_name} : ${assetLink}! That ends the *${user.type}* phase and your effort has been recorded. Type '/pomo start to take a break`
				:`Pomo timer complete for @${user.user_name}! That ends the *${user.type}* phase. Type '/pomo start to start the next phase`;
			axios.post(user.response_url, {
							text: message,
							response_type: 'in_channel'
						});
		} else {
			console.warn(`no response url for ${user.user_name} ${user.time_start}`);
		}
		if (workComplete(user)) {
			console.info("sending actual info");
			getOrUseV1UserOid(user, v1UserOid => {
				updateActual(0.5, v1UserOid, user.scopeOid, user.workItemOid, user.time_start.format(DATE_FORMAT));
			});
		} else {
			console.warn("not updating effort");
		}
	}
}

function get_today(data){
	const response_url =data.response_url;
	getOrUseV1UserOid(data, (id) =>	getEffort(id, moment().format(DATE_FORMAT))).then(val => {
			if (response_url) {
				axios.post(response_url, {
					text: JSON.stringify(val),
					response_type: 'in_channel'
				});
			}
		}

	);
}

function getOrUseV1UserOid(data, callback) {
	const user = getUser(data);
	return new Promise(
		function (resolve, reject) {
			if (!user.v1UserOid) {
				console.log('hi')
				return getV1UserFromSlack(user.user_id).then(v1UserOid => {
					user.v1UserOid = v1UserOid;
					resolve(callback(user.v1UserOid));
				});
			}else {
				console.log('ho')
				resolve(callback(user.v1UserOid));
			}
		}
	);
}
