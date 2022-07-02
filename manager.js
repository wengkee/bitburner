import { getAllOtherServers } from "helper.js"
import { prepServer } from "helper-attack-v2.js"
/** @param {NS} ns */

export async function main(ns) {

	const cmd = ns.args[0]

	const target = "phantasy"

	if(cmd === "start-cmd"){
		ns.exec("cmd.js", "home", 1, target)

	} 
	
	else if (cmd === "start"){
		// specify instance to run the loop
		// "all" - running with all servers
		// "others" - running with all rooted servers, excluding purchased servers
		// "server_name" - run only with the server specified
		ns.exec("controller-v2.js", "home", 1, target, "all")

	}
	
	else if (cmd === "stop"){
		for( let instance of getAllServers(ns) ){
			ns.kill("controller-v2.js", "home", 1, target, instance)
		}

	} 
	
	else if (cmd === "status"){
		await ns.exec("get-best.js", "home", 1, target)
		
	} 
	
	else if (cmd === "prep"){
		for( let server of getAllOtherServers(ns) ){
			if( server === target ) continue
			// await ns.exec("prep-server.js", "home", 1, server)
			await prepServer(ns, server)
			await ns.sleep(25)
		}
		
	} 
	
	else {
		throw Error("Unknown command")
	}

}