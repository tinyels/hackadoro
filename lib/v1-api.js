import {readFileSync} from 'fs';
import axios from 'axios';
import { v1RootUrl, v1AccessToken  } from './env';

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
