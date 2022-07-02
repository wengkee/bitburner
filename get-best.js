import { 
	formatNum, 
	formatTime, 
	getAllServers, 
	getAllInternalServers, 
	getAllServersAvailableMem, 
	getAllServerMaxMem, 
	getAvailableMemOfServers, 
	getMaxMemOfServers,
	getAllOtherServers,
	getAvailableMem
} from "helper.js"


/** @param {NS} ns */
export async function main(ns) {

	let servers = []
	if(ns.args[0]){

		if(  ns.args[0].indexOf(" ") > 0 ){
			servers = ns.args[0].split(" ")
		} else {
			servers = servers.concat(ns.args)
		}

		ns.tprint("Filter mode for server: " + servers)

		getServerInfo(ns, servers)

	} else {
		servers = getAllServers(ns)
		getServerInfo(ns, servers)
	}
	
	let allServersAvailRam = formatNum(getAllServersAvailableMem(ns))
	let allServersMaxRam = formatNum(getAllServerMaxMem(ns))

	let allIntAvailRam = formatNum(getAvailableMemOfServers(ns, getAllInternalServers(ns)))
	let allIntMaxRam = formatNum(getMaxMemOfServers(ns, getAllInternalServers(ns)))

	let homeAvailRam = formatNum(getAvailableMem(ns, "home"))
	let homeMaxRam = formatNum(ns.getServerMaxRam("home"))

	let allOtherAvailRam = formatNum(getAvailableMemOfServers(ns, getAllOtherServers(ns)) - getAvailableMem(ns, "home"))
	let allOtherMaxRam = formatNum(getMaxMemOfServers(ns, getAllOtherServers(ns)) - - ns.getServerMaxRam("home"))

	ns.tprint("Avai. / Max Ram: " + allServersAvailRam + " / " + allServersMaxRam)
	ns.tprint("Avai. / Max Internal Ram: " + allIntAvailRam + " / " + allIntMaxRam)
	ns.tprint("Avai. / Max Other Ram: " + allOtherAvailRam + " / " + allOtherMaxRam)
	ns.tprint("Curr / Max Home Ram: " + homeAvailRam + " / " + homeMaxRam)
	if(ns.serverExists("castle-black-1")){
		ns.tprint("Curr. Internal Ram / Server: " + ns.getServerMaxRam("castle-black-1"))
	}
	

}

export function getServerInfo(ns, servers){

	ns.tprintf("%-20s | %7s | %8s | %8s | %8s | %5s | %10s | %10s | %10s | %10s | %10s | %10s ", 
					"Server:", 
					"Min Sec", 
					"Curr Sec", 
					"Max $", 
					"Curr $", 
					"HackL", 
					"Hack T", 
					"Weaken T", 
					"Grow T",
					"Hack Mem",
					"Grow Mem",
					"Weaken Mem")
	ns.tprintf("###############################################################################################################################################################")
	
	const hackMem = ns.getScriptRam("hack-v2.js")
	const growMem = ns.getScriptRam("grow-v2.js")
	const weakenMem = ns.getScriptRam("weaken-v2.js")
	
	for( let server of servers ){

		if(server == "") continue

		let currM = ns.getServerMoneyAvailable(server)
		let maxM = ns.getServerMaxMoney(server)
		let hackL = ns.getServerRequiredHackingLevel(server)

		if(server.length == 0 || server.startsWith("castle-black" ) || maxM <= 0 || hackL > ns.getHackingLevel() ) continue

		let minS = ns.getServerMinSecurityLevel(server)
		let currS = ns.getServerSecurityLevel(server)
		let hackT = ns.getHackTime(server)
		let weakT = ns.getWeakenTime(server)
		let growT = ns.getGrowTime(server)

		const halfMoney = ns.getServerMaxMoney(server) / 2

		// Get the num of threads needed if we were to hack away half of the money
		const hackThreads = ns.hackAnalyzeThreads(server, halfMoney)
		// Get the security level increased if we were to get half of the money
		let secIncreased = ns.hackAnalyzeSecurity(hackThreads, server)

		// Get the num of threads needed if we were to grow back half of the money
		const growThreads = ns.growthAnalyze(server, halfMoney, 1) 
		secIncreased += ns.growthAnalyzeSecurity(growThreads, server, 1)

		// Get the number of threads needed to contra the effect of hack
		let weakenThreads = Math.ceil(secIncreased / 0.05)


		ns.tprintf("%-20s | %7s | %8s | %8s | %8s | %5s | %10s | %10s | %10s | %10s | %10s | %10s", 
			server, 
			formatNum(minS),
			formatNum(currS),
			ns.nFormat(maxM, '0a'),
			ns.nFormat(currM, '0a'),
			hackL, 
			formatTime(hackT),
			formatTime(weakT),
			formatTime(growT),
			formatNum(Math.ceil(hackThreads * hackMem)),
			formatNum(Math.ceil(growThreads * growMem)),
			formatNum(Math.ceil(weakenThreads * weakenMem))
		)
	}

}