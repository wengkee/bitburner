import { getAvailableMem, getAllServers  } from "helper.js"


const hackMem = 1.7
const growMem = 1.75
const weakenMem = 1.75
const secDecreasedPerThread = 0.05
const hackScript = "hack-v3.js"
const growScript = "grow-v3.js"
const weakenScript = "weaken-v3.js"

/** @param {NS} ns */
export async function main(ns) {
	const target = ns.args[0]
	await prepTargetServer(ns, target)
	ns.tprint("done")
}


async function runGrow(ns, growThreads, target, sleeptime, currTime){

	for( let server of getAllServers(ns) ){

		let availableThreads = Math.floor( getAvailableMem(ns, server) / growMem)
		if(availableThreads <= 0) continue

		let threads = (availableThreads < growThreads)? availableThreads : growThreads
		if(threads > 0)	{
			await ns.exec(growScript, server, threads, target, sleeptime, currTime)
		}
		growThreads -= threads

		if(growThreads == 0) break
	}
}

async function runWeaken(ns, weakenThreads, target, sleeptime, currTime){

	for( let server of getAllServers(ns)) {

		let availableThreads = Math.floor(getAvailableMem(ns, server) / weakenMem)
		if(availableThreads <= 0) continue

		let threads = (availableThreads < weakenThreads)? availableThreads : weakenThreads
		if(threads > 0) {
			await ns.exec(weakenScript, server, threads, target, sleeptime, currTime)
		}
		weakenThreads -= threads

		if(weakenThreads == 0) break

	}
}

async function prepTargetServer(ns, target){

	// To prepare the server to be at 
	// maximum $$
	// minimum security
	let secDiff = 0

	const maxMoney = ns.getServerMaxMoney(target) 
	const minSec = ns.getServerMinSecurityLevel(target)
	const currTime = Date.now()

	// security is higher than acceptable level
	// weaken it to minimum first
	while(ns.getServerSecurityLevel(target) > minSec + 5){
		ns.tprint("here")
		let secToBeReduced = ns.getServerSecurityLevel(target) - minSec
		await runWeaken(ns, Math.ceil(secToBeReduced/secDecreasedPerThread), target, 0, currTime)
		await weakenSleep(ns, target)
	}

	// security is low enough to grow money
	// grow money and also contra or keep security low
	while ( ns.getServerMoneyAvailable(target) < maxMoney * 0.95 || ns.getServerSecurityLevel(target) > minSec + 2) {
		
		let currMoney = ns.getServerMoneyAvailable(target)
		let currSec = ns.getServerSecurityLevel(target)

		if(currMoney < maxMoney  * 0.95){
			
			let growThreads = ns.growthAnalyze(target, maxMoney - currMoney)
			let growSecIncreased = ns.growthAnalyzeSecurity(growThreads, target, 1)

			ns.print("Grow will increase sec by " + growSecIncreased)
			secDiff += growSecIncreased
			ns.print("Grow: secDiff " + secDiff)
			await runGrow(ns, growThreads, target, 0, currTime)
		}

		if(currSec > minSec + 2){
			secDiff += currSec - minSec
		}
		ns.print("[PREP_SERVER] currSec - minSec: " + ns.nFormat(secDiff, '0,0'))

		let weakenThreads = Math.ceil(secDiff / 0.05)
		await runWeaken(ns, weakenThreads, target, 0, currTime)
		await weakenSleep(ns, target)
	}
}

async function weakenSleep(ns, target){
	await ns.sleep(ns.getWeakenTime(target)  + 100)
}