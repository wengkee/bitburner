/** @param {NS} ns */
export async function main(ns) {
	let maxServers = ns.getPurchasedServerLimit()
	ns.tprint("Max Servers: " + maxServers)

	for ( let i = 1; i <= 20; i++){
		let ram = Math.pow(2,i)
		let cost = ns.getPurchasedServerCost( ram )
		// ns.tprint(cost)
		ns.tprint(ram + ", " + ns.nFormat(cost, '$0a') + ", total cost: " + ns.nFormat(cost * maxServers, '$0a'))
	}


}