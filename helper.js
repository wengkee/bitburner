const homeReservedMem = 50

/** @param {NS} ns */
export function formatNum(n) {
	const options = { 
		minimumFractionDigits: 0,
		maximumFractionDigits: 0 
	};

	let num = Number(n).toLocaleString('en', options)
	return num
}

export function formatTime(d) {
    d = Number(d);
    d = d /1000;
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + "h " : "";
    var mDisplay = m > 0 ? m + "m " : "";
    var sDisplay = s > 0 ? s + "s" : "";
    return hDisplay + mDisplay + sDisplay; 
}

export function getAllServers(ns){
	return getAllOtherServers(ns).concat(getAllInternalServers(ns))
}

export function getAllOtherServers(ns){
	let servers = ns.read("other-servers.txt").split("\n")
	if(servers.length == 0 || servers[1] == "") servers =  []
	return servers
}

export function getAllInternalServers(ns){
	let servers = ns.read("internal-servers.txt").split("\n")
	if(servers.length == 0 || servers[1] == "") servers =  []
	return servers
}

export function getAllServersAvailableMem(ns){
	let totalFreeRam = 0
	let servers = getAllServers(ns)
	for(let server of servers){
		if(server === "") continue
		let availableRam = Math.floor(ns.getServerMaxRam(server) - ns.getServerUsedRam(server))
		if(server === "home") availableRam -= homeReservedMem
		totalFreeRam += availableRam
	}
	return totalFreeRam
}

export function getAllServerMaxMem(ns){
	let totalMaxRam = 0
	let servers = getAllServers(ns)
	for(let server of servers){
		if(server === "") continue
		let maxRam = ns.getServerMaxRam(server)
		if(server === "home") maxRam -= homeReservedMem
		totalMaxRam += maxRam
	}
	return totalMaxRam
}

export function getAvailableMem(ns, server){
	if(server === "") return 0
	let mem = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
	if(server === "home") mem -= homeReservedMem
	return mem
}

export function getAvailableMemOfServers(ns, servers){

	let totalMem = 0
	for( let server of servers){
		totalMem += getAvailableMem(ns, server)
		if(server === "home") totalMem -= homeReservedMem
	}

	return totalMem
}

export function getMaxMemOfServers(ns, servers){

	let totalMem = 0
	for( let server of servers){
		if(server === "") continue
		totalMem += ns.getServerMaxRam(server)
		if(server === "home") totalMem -= homeReservedMem
	}

	return totalMem
}