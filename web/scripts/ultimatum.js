/*
 * Ultimatum Game
 *
 * Created for Dan Ariely's Coursera Course "A Beginner's Guide to Irrational Behavior" April 2013
 *
 * A simulation of computer agents playing the ultimatum game, evolving limits with a genetic algorithm
 *
 * author: Björn Günzel ultimatum-game@blinker.net
 */

function ultimatumGame() {

    function log(msg){
       // console.log(msg)
    }

    var generationStats = []

    var populationSize = 100
    var population = []

    var generation = 0//number of generations / evolve steps taken
    var maxGenerations = 1000 //number of generations to run the simulation

    var totalGain = 0 //combined worth of the population in the last round
    
    var mutationRate = 0.01// 0.01

    //number of encounters to roll per player per step
    //(agents may end up having more encounters than that)
    var encountersPerStep = 10

    var deathsPerStep = 20

    //run or pause the simulation
    var isRunning = false

    function Agent(gene){
        this.gene = gene
    }

    Agent.prototype = {
        /*
         * the offer (in %) the agent will make
         */
        getOffer: function(){
            return (this.gene >>> 8)/255
        },

        /*
         * the minimum offer (in %) the agent will accept
         */
        getMinOffer: function(){
            return (this.gene & 0xff)/255
        }
    }

    function createRandomGene(){
        return Math.floor(Math.random() * 0xffff)
    }

    function initPopulation(){
        log("init")

        population = new Array(populationSize)

        log("population size: "+population.length)

        $.each(population, function(i, a){
                var agent = new Agent(createRandomGene())
                log("created agent "+i+": "+agent.getOffer()+", "+agent.getMinOffer())
                population[i] = agent
            })

        generation = 0

        generationStats = []

    }

    function mate(agent1, agent2){
        var gene1 = agent1.gene
        var gene2 = agent2.gene

        var crossover = 1+Math.floor((Math.random()*15))
        var template = Math.pow(2,crossover)-1

        var newGene = (gene1 & (~ template)) | (gene2 & template)

        for(var i = 0;i<16;i++){
            if(Math.random() < mutationRate){
                //flip allele
                var bit = 1 << i

                var newBit = (~ newGene) & bit

                newGene = (newGene | newBit) & (~bit | newBit)
            }
        }

        return new Agent(newGene)
    }    
    
    function playUltimatum(amount, giver, receiver){
        if(giver.getOffer() >= receiver.getMinOffer()){
            var give = amount*giver.getOffer() 
            giver.worth += amount - give 
            receiver.worth += give
        }

        giver.playCount++
        receiver.playCount++
    }

    function initStep(){
        //reset agent playCounts and worth
        $.each(population, function(i, agent){
                agent.worth = 0
                agent.playCount = 0
            })
    }

    function playGames(){
        for (var i = 0;i < population.length; i++){
            var agent1 = population[i]

            for(var j = 0; j < encountersPerStep;j++){
                var agent2 = population[Math.floor(Math.random()*population.length)]

                if(Math.random() < 0.5){
                    playUltimatum(100, agent1, agent2)
                } else {
                    playUltimatum(100, agent2, agent1)
                }
            }
        }
    }

    //calulate fitness as average gain per game
    function calculateFitness(){
        totalGain = 0

        $.each(population, function(index, agent){
                agent.averageGain = agent.worth/agent.playCount
                totalGain += agent.averageGain
            })

        //remember average gain for visualization
        generationStats.push([generation, totalGain/populationSize])
    }

    function killAgents(){
        //pick {deathsPerStep} agents to die, swap to end of population array
        for(var deathCount = 0;deathCount < deathsPerStep;deathCount++){
            
            var deathIndex = Math.floor(Math.random()*(populationSize-deathCount))

            var agentToDie = population[deathIndex]

            population[deathIndex] = population[populationSize - deathCount-1]

            population[populationSize - deathCount - 1] = agentToDie

            //log("killed index: "+deathIndex+", agent: "+agentToDie)

            totalGain -= agentToDie.averageGain
        }
    }


    /*
     * pick parent sort of like a roulette wheel where field size is proportional to fitness
     * higher averageGain increases likelihood of becoming a parent
     */
    function pickParent(){
        var gainPicked = Math.random()*totalGain

        var gain = 0

        var i = 0

        var parent = null

        while(gainPicked > gain){
            parent = population[i]

            gain += parent.averageGain

            i++
        }

        return parent
    }


    function createOffspring(){
        //pick parents with roulette method, create new agents
        for(var births = 0;births < deathsPerStep;births++){
            var parent1 = pickParent()
            var parent2 = pickParent()

            population[populationSize - births-1] = mate(parent1, parent2)
        }        
    }

    function calculateStep(){

        initStep()

        log("initialised")

        playGames()

        log("games played")

        calculateFitness()

        log("fitness calculated, total gain: "+totalGain)

        killAgents()

        log("agents killed")
    
        createOffspring()

        log("offspring created")

        generation++
    }

    function visualize(){
        //$("#generation")[0].innerText = generation

        //log("pop size: "+population.length)
        var popData = new Array(populationSize)
        
        
        $.each(population, function(i, agent){
                //log("process agent "+i+": "+agent)
                popData[i] = [agent.getOffer(), agent.getMinOffer()]
            })
        //popData.sort(function(a,b){return a[0]-b[0]})
        //log("popData: "+popData)
        //log("popData.length: "+popData.length)
        var popOptions = {
            series: {
                lines: { show: false},
                points: { show: true }
            },
            xaxis: {
                min: 0,
                max: 1,
                axisLabel: "offer"
            },
            yaxis: {
                min: 0,
                max: 1,
                axisLabel: "min offer"
            }

        }
        $.plot($("#populationChart"), [{label: "agents in generation "+generation, data: popData}], popOptions)

        var evoOptions = {
            series:{
                lines: {show: true}
            },
            xaxis: {
                min: 0,
                max: maxGenerations,
                axisLabel: "generation"
            },
            yaxis: {
           //     min: 0,
           //     max: 100
                axisLabel: "average gain"
            },
            legend: {
                position: "se"
            }
        }

        $.plot($("#evolutionChart"), [{label: "average gain", data: generationStats}], evoOptions)
    }

    function step(){
        log("step "+generation)
        if(generation < maxGenerations){
            calculateStep()
            visualize()
        }
    }

    function run(){
        if(isRunning && generation < maxGenerations){
            step()
            window.setTimeout(run)
        }
    }

    function toggleRun(){
        log("toggle run from "+isRunning)
        isRunning = !isRunning

        labelRunButton()

        if(isRunning){
            run()
        }
    }

    function labelRunButton(){
        var label = "Pause"
        
        if(!isRunning){
            label = "Run"
        }

        $("#runLabel")[0].innerHTML= label
        $("#runIcon").toggleClass("icon-play", !isRunning)
        $("#runIcon").toggleClass("icon-pause", isRunning)

    }

    function reset(){
        log("reset")

        isRunning = false
        readParameters()
        initPopulation()
        visualize()
        labelRunButton()
    }

    function readParameters(){
        var form = $("#parameters")

        populationSize = parseInt($("#populationSize").val())
        log("populationSize: "+populationSize)

        maxGenerations = parseInt($("#maxGenerations").val())
        log("maxGenerations: "+maxGenerations)

        mutationRate = parseFloat($("#mutationRate").val())
        log("mutationRate: "+mutationRate)

        encountersPerStep = parseInt($("#encountersPerStep").val())
        log("encountersPerStep: "+encountersPerStep) 

        var deathsPerStepPercent = parseInt($("#deathsPerStep").val())
        deathsPerStep = Math.floor(populationSize*deathsPerStepPercent/100)
        log("deathsPerStepPercent: "+deathsPerStepPercent+", deathsPerStep: "+deathsPerStep)
    }

    $('#toggleRun').click(toggleRun)
    $('#step').click(step)
    $('#reset').click(reset)

    labelRunButton()

    initPopulation()

    visualize()
}

$(ultimatumGame)


