/** @param {NS} ns */
export async function main(ns) {

    const serverPrefix = "castle-black-"

	let ram = ns.args[0]
    if(!ram) ram = 1048576
    
    const limit = ns.getPurchasedServerLimit()
    let idx = 1

	while ( ns.getPurchasedServers.length < limit && idx <= limit) {
        if ( ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) {

            let name = serverPrefix + idx
            if( ! ns.serverExists(name) ){
                let target = ns.purchaseServer(serverPrefix + idx, ram)
                ns.tprint(target + " is purchased")
            }
            idx++
        }
        await ns.sleep(100)
    }

}