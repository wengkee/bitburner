import { getAvailableMem, getAvailableMemOfServers, getAllInternalServers  } from "helper.js"

const hackMem = 1.7
const growMem = 1.75
const weakenMem = 1.75
const secDecreasedPerThread = 0.05
const hackScript = "hack-v3.js"
const growScript = "grow-v3.js"
const weakenScript = "weaken-v3.js"

/** @param {NS} ns */
export async function main(ns) {

	ns.disableLog("ALL")

	const target = ns.args[0]

	await prepTargetServer(ns, target)

	while (true){
		
		const moneyToBeHacked = ns.getServerMaxMoney(target) * 0.5

		// Get the num of threads needed if we were to hack away half of the money
		const hackThreads = Math.ceil(ns.hackAnalyzeThreads(target, moneyToBeHacked))
		// Get the security level increased if we were to get half of the money
		let secIncreasedByHack = ns.hackAnalyzeSecurity(hackThreads, target)

		// Get the num of threads needed if we were to grow back half of the money
		const growThreads = Math.ceil(ns.growthAnalyze(target, moneyToBeHacked, 1))
		let secIncreasedByGrow = ns.growthAnalyzeSecurity(growThreads)

		// Get the number of threads needed to contra the effect of hack
		let weakenHackThreads = Math.ceil(secIncreasedByHack / secDecreasedPerThread)
		let weakenGrowThreads = Math.ceil(secIncreasedByGrow / secDecreasedPerThread)

		const ht = ns.getHackTime(target)
		const wt = ns.getWeakenTime(target)
		const gt = ns.getGrowTime(target)

		const hRequiredMem = hackThreads * hackMem
		const wgRequiredMem = weakenGrowThreads * weakenMem
		const whRequiredMem = weakenHackThreads * weakenMem
		const gRequiredMem = growThreads * growMem
		const totalRequiredMem = hRequiredMem + wgRequiredMem + whRequiredMem + gRequiredMem

		if ( hackThreads > 0 && growThreads > 0 && weakenHackThreads > 0 && weakenGrowThreads > 0
				&& getAvailableMemOfServers(ns, getAllInternalServers(ns)) > totalRequiredMem ){

			// hack > weaken > grow > weaken
			let currTime = Date.now()
			ns.print( "[" + target  + "] mem to hack: " + hRequiredMem)
			await runHack(ns, hackThreads, target, wt - ht - 200, currTime)
			
			ns.print( "[" + target  + "] mem to weaken: " + whRequiredMem)
			await runWeaken(ns, weakenHackThreads, target, 0, currTime)
		
			ns.print( "[" + target  + "] mem to grow: " + gRequiredMem)
			await runGrow(ns, growThreads, target, wt - gt + 100, currTime)
			
			ns.print( "[" + target  + "] mem to weaken: " + wgRequiredMem)
			await runWeaken(ns, weakenGrowThreads, target, 200, currTime)
		} else {
			// ns.print("totalRequiredMem: " + totalRequiredMem + ", hackThreads: " + hackThreads + ", growThreads:" 
			// 			+ growThreads + ", weakenHackThreads: " + weakenHackThreads + ", weakenGrowThreads: " + weakenGrowThreads)
			// ns.print("growThreads: " + growThreads)
			// ns.print("secIncreasedByGrow: " + ns.growthAnalyzeSecurity(growThreads))
		}
		
		await ns.sleep(1000)
	}

}

async function runHack(ns, hackThreads, target, sleeptime, currTime){

	for( let server of getAllInternalServers(ns)) {

		let availableThreads = Math.floor(getAvailableMem(ns, server) / hackMem)
		if(availableThreads == 0) continue

		let threads = (availableThreads < hackThreads)? availableThreads : hackThreads
		if(threads > 0) await ns.exec(hackScript, server, threads, target, sleeptime, currTime)
		hackThreads -= threads

		if(hackThreads == 0) break
	}
}

async function runGrow(ns, growThreads, target, sleeptime, currTime){

	for( let server of getAllInternalServers(ns) ){

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

	for( let server of getAllInternalServers(ns)) {

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
		await runWeaken(ns, weakenThreads, target, 0, 0, currTime)
		await weakenSleep(ns, target)
	}
}

async function weakenSleep(ns, target){
	await ns.sleep(ns.getWeakenTime(target)  + 100)
}