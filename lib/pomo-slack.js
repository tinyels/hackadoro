import axios from 'axios';
import moment from 'moment';
import {getWorkItemByNumber, updateActual, getAssetLink} from './v1-api';
let user_hash = {};

const commands = {
	'start' : (opt,data) => pomo_start(data, opt),
	'stop'  : (opt,data) => pomo_stop(data, opt),
	'status': (opt,data) => pomo_status(data.user_name),
	'yesterday': () => "forthcoming"
};

const minutes =(int) => 15000;//int * 60 * 1000;

function getCommand(str) {
	const trimmed = str.trim();
	if (trimmed.indexOf(' ') === -1)
		return trimmed;
	else
		return trimmed.substr(0, trimmed.indexOf(' '));
}

function getOptions(str){
	const trimmed = str.trim();
	if (trimmed.indexOf(' ') === -1)
		return null;
	else
		return trimmed.substr(trimmed.indexOf(' ')+1);
}


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
		getWorkItemByNumber(opt).then((result) => {
			try {
				const workItem = result.data[0][0];
				u.workItemOid = workItem._oid;
				u.scopeOid = workItem.Scope._oid;
				u.assetLink = getAssetLink(opt);
				return `Pomodoro timer has been started for <${u.assetLink}|${opt}>. ${u.minutes} minutes remain.`;
			} catch (e){
				console.log(result.data);
				console.error("could not pull off workItemOid or scopeOid", e);
			}
		});

	}
	return `Pomodoro timer has been started. ${u.minutes} minutes remain.`;
}

function pomo_stop(data){
	let u = user_hash[data.user_name]

	if(u) {
		const type = u.type;
		clearTimeout(u.handle);
		u.handle = null;
		u.type = null;
		done(u);
	}
}
function pomo_status(user_name) {
	const u = (user_hash[user_name]);
	return `user:${u.user_name}, type:${u.type}, start_time: ${u.time_start.toISOString()}, workItemOid: ${u.workItemOid}, scopeOid: ${u.scopeOid}`;
}

function start_pomo_timer(data) {
	const user_name = data.user_name;
	if(user_hash[user_name] == undefined) {
		user_hash[user_name] = {};
	}

	let u = user_hash[user_name];

	u.time_start = moment();
	u.response_url = data.response_url;
	u.user_name= user_name;

	if(u.type == "work") {
		u.type = "break";
		u.minutes = 5;
	}
	else {
		u.type = "work";
		u.minutes = 25 ;
	}
	u.handle = setTimeout(done(u), minutes(u.minutes));
	return u;
}

function workComplete(data) {
	return data.type === "work" && data.scopeOid && data.workItemOid;
}
function done(data){
	return ()=> {
		if (data.response_url) {
			console.info(`ending pomo by sending a message to ${data.response_url}`);
			const message = workComplete(data)? `Pomo timer complete for ${data.user_name} : ${data.assetLink}! That ends the *${data.type}* phase and your effort has been recorded. Type '/pomo start to take a break`
				:`Pomo timer complete for ${data.user_name}! That ends the *${data.type}* phase. Type '/pomo start to start the next phase`;
			axios.post(data.response_url, {
							text: message,
							response_type: 'in_channel'
						});
		} else {
			console.warn(`no response url for ${data.user_name} ${data.time_start}`);
		}
		if (workComplete(data)) {
			console.info("sending actual info");
			//hack: need a way to look up user member oid and need to make sure date is same as server
			updateActual(0.5, "Member:1040", data.scopeOid, data.workItemOid, data.time_start.format('YYYY-MM-DD'));
		}else{
			console.warn("not updating effort");
		}
	}
}
