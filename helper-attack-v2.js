import { getAvailableMem, getAllServersAvailableMem, getAllOtherServers, getAllServers  } from "helper.js"

const hackScript = "hack-v3.js"
const growScript = "grow-v3.js"
const weakenScript = "weaken-v3.js"
const hackMem = 1.7
const growMem = 1.75
const weakenMem = 1.75
const secDecreasedPerThread = 0.05

/** @param {NS} ns */
export async function runHack(ns, hackThreads, target, sleeptime, currTime, instance){

	// for( let server of getAllServers(ns) ) {
	for( let server of getInstanceServer(ns, instance) ) {
		let availableThreads = Math.floor(getAvailableMem(ns, server) / hackMem)
		if(availableThreads == 0) continue

		let threads = (availableThreads < hackThreads)? availableThreads : hackThreads
		if(threads > 0) await ns.exec(hackScript, server, threads, target, sleeptime, currTime)
		hackThreads -= threads

		if(hackThreads == 0) break
	}
}

export async function runGrow(ns, growThreads, target, sleeptime, currTime, instance){

	// for( let server of getAllServers(ns) ) {
	for( let server of getInstanceServer(ns, instance) ) {

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

export async function runWeaken(ns, weakenThreads, target, sleeptime, currTime, instance){

	// for( let server of getAllServers(ns) ) {
	for( let server of getInstanceServer(ns, instance) ) {

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

export async function weakenSleep(ns, target){
	await ns.sleep(ns.getWeakenTime(target)  + 100)
}

export async function prepServer(ns, target){

	// const instance = 0
	const instance = "home"

	// const currentSecGap = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)
	// const moneyToGrow = ns.getServerMaxMoney(target) - ns.getServerMoneyAvailable(target)

	// keep running the loop if money is not max
	// and sec is not min
	while( ! checkIdealServer(ns, target) ){

		ns.print("in loop")
		let currentSecGap = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)
		let moneyToGrow = ns.getServerMaxMoney(target) - ns.getServerMoneyAvailable(target)

		let totalRequiredMem = 0

		// Get the num of threads needed if we were to grow back half of the money
		if (moneyToGrow > 0){

			var growThreads = Math.ceil(ns.growthAnalyze(target, moneyToGrow, 1))

			var secIncreasedByGrow = ns.growthAnalyzeSecurity(growThreads)
			var weakenGrowThreads = Math.ceil(secIncreasedByGrow / secDecreasedPerThread)

			var gRequiredMem = growThreads * growMem
			var wgRequiredMem = weakenGrowThreads * weakenMem
			totalRequiredMem += gRequiredMem + wgRequiredMem
		}

		// Get the number of threads needed to contra the effect of hack
		if (currentSecGap > 0){
			var weakenDeductThreads = Math.ceil(currentSecGap / secDecreasedPerThread)
			var wdRequiredMem = weakenDeductThreads * weakenMem
			totalRequiredMem += wdRequiredMem
		}

		const wt = ns.getWeakenTime(target)
		const gt = ns.getGrowTime(target)


		let availMem = getAllServersAvailableMem(ns)
		if ( availMem > totalRequiredMem ){

			// hack > weaken > grow > weaken
			let currTime = Date.now()
			let weakenIsRan = false

			if(weakenDeductThreads > 0){
				ns.print( "[" + target  + "] mem to weaken: " + wdRequiredMem + ", running weaken")
				await runWeaken(ns, weakenDeductThreads, target, 0, currTime, instance)
				weakenIsRan = true
			}
		
			if(weakenGrowThreads > 0 && growThreads > 0 ){
				ns.print( "[" + target  + "] mem to grow: " + gRequiredMem + ", running grow")
				await runGrow(ns, growThreads, target, wt - gt + 100, currTime, instance)
				
				ns.print( "[" + target  + "] mem to weaken: " + wgRequiredMem + ", running weaken")
				await runWeaken(ns, weakenGrowThreads, target, 200, currTime, instance)
				weakenIsRan = true
			}

			if(weakenIsRan) await weakenSleep(ns, target)

		} else {
			ns.print("availMem: " + availMem + ", totalRequiredMem: " + totalRequiredMem)
			ns.print("Insufficient memory, waiting longer for memory to free up..")
			await ns.sleep(5000)
		}
	}

	
	await ns.sleep(1000)
	
}

function checkIdealServer(ns, target){

	let currentSecGap = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)
	let moneyToGrow = ns.getServerMaxMoney(target) - ns.getServerMoneyAvailable(target)

	ns.print("currentSecGap: " + currentSecGap + ", moneyToGrow: " + moneyToGrow)

	if(currentSecGap > 0 || moneyToGrow > 0) {
		ns.print("false")
		return false

	} else {
		ns.print("true")
		return true
	}

	
	// let ns.getServerMaxMoney(target) - ns.getServerMoneyAvailable(target) > 0 && ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target) > 0
}

export function getInstanceServer(ns, instance){

	if(instance === "others") return getAllOtherServers(ns)
	if(instance === "all") return getAllServers(ns)

	let server = instance
	return [server]
}