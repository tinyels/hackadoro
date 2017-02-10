import {readFileSync} from 'fs';
import axios from 'axios';
import sdk, {axiosConnector } from 'v1sdk';
import { v1RootUrl, v1Protocol, v1Port, v1Host, v1Instance, v1AccessToken  } from './env';

const axiosConnectedSdk = axiosConnector(axios)(sdk);
const isHttps = v1Protocol === 'https';
export const v1 = (token) => axiosConnectedSdk(v1Host, v1Instance, v1Port, isHttps).withAccessToken(token);

const MY_WORK_QUERY = readFileSync('./app/query.yaml', 'utf8');

export const getAssetLink = (number) => `<${v1RootUrl}/assetdetail.v1?Number=${number}|${number}>`

function queryV1(query){ //can't use YAML with v1sdk
	const instance = axios.create({
		baseURL: v1RootUrl,
		headers: {
			'Authorization': v1AccessToken,
			'Content-Type': "text/plain"
		}
	});
	return instance.post("/query.v1", query);
}
export function myWorkitems(userOid){ //Member:399984
	return queryV1({
		"from": "PrimaryWorkitem",
		"filter": [
		"Owners=\"" + userOid + "\"",
		"AssetState=\"Active\"",
		"Status.Name!=\"Done\""
	],
		"select": [
		"Name",
		"Number",
		"Description",
		"Status.Name"
	],
		"sort": [
		"+Order"
	]
	}).then(r => r.data[0].map(item => ({number: item['Number'], name: item['Name'], status:item['Status.Name']})));
}

export function getEffort(userOid,date){
	return queryV1({
		from:"Actual",
		filter:[
			"Member=\"" + userOid + "\"",
			"Date=\"" + date + "\""
		],
		select: [
			"Value",
			"Workitem.Name",
			"Workitem.Number"
		]
	}).then(r=>{
		console.log("getEffort", userOid, date);
		let items = {};
		r.data[0].forEach((item)=>{
			const num =  item['Workitem.Number'];
			let curr = items[num];
			if (!items[num]) {
				curr = items[num] = {};
				curr.number = num;
				curr.name = item['Workitem.Name'];
				curr.val = 0.0;
			}
			curr.val = curr.val + parseFloat(item.Value);
		});
		Object.keys(items).forEach(function (key) {
			items[key].val = items[key].val.toFixed(2);
		});
		return items;
	});
}
export function getMyWork(){
	return queryV1(MY_WORK_QUERY);
}

export function getMemberByEmail(email){
	return queryV1({
		"from": "Member",
		"filter":[
			"Email=\""+ email + "\"",
		],
		"select": [
			"Name"
		]
	})
}

export function getWorkItemByNumber(number){
	return queryV1({
		"from": "Workitem",
		"filter":[
			"Number=\""+ number + "\"",
		],
		"select": [
			"Name",
			"Scope"
		]
	});
}

export function updateActual(hours, memberOidToken, scopeOidToken, workitemOidToken, date) {
	console.log("updateActual", ...arguments);
	v1(v1AccessToken).create('Actual',{
		Value: hours,
		Member: memberOidToken,
		Scope: scopeOidToken,
		Workitem: workitemOidToken,
		Date: date
	}).catch(ruh_ro=> console.error("updateActual went wrong", ruh_ro));
}