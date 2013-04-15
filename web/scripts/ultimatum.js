/*
 * Ultimatum Game
 *
 * Created for Dan Ariely's Coursera Course "A Beginner's Guide to Irrational Behavior" April 2013
 *
 * A simulation of computer agents playing the ultimatum game, evolving limits with a genetic algorithm
 *
 * author: Björn Günzel ultimatum-game@blinker.net
 */

(function() {

    var populationSize = 0
    var population = []

    var totalGain = 0 //combined worth of the population in the last round
    
    var mutationRate = 0.1

    //number of encounters to roll per player per step
    //(agents may end up having more encounters than that)
    var encountersPerStep = 10

    var deathsPerStep = 

    function Agent(gene){
        this.gene = gene
    }

    Agent.prototpye = {
        /*
         * the offer (in %) the agent will make
         */
        getOffer = function(){
            return (this.gene >>> 8)/255
        }

        /*
         * the minimum offer (in %) the agent will accept
         */
        getMinOffer = function(){
            return (this.gene & 0xff)/255
        }
    }

    function createRandomGene(){
        return Math.floor(Math.random() * 0xffff)
    }

    function init(){
        
        population = new Array(populationSize)
        $.map(population, function(agent, i){
                return new Agent(createRandomGene())
            })
    }

    function mate(agent1, agent2){
        var gene1 = agent.gene
        var gene2 = agent.gene

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
    }

    functions killAgents(){
        //pick {deathPerStep} agents to die, swap to end of population array
        for(var deathCount = 0;deathCount < deathPerStep;deathCount++){
            
            var deathIndex = Math.floor(Math.random()*(populationSize-deathCount))

            var agentToDie = population[deathIndex]

            population[deathIndex] = population[populationSize - deathCount-1]

            population[populationSize - deathCount - 1] = agentToDie

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
        for(var births = 0;births < deathPerStep;births++){
            var parent1 = pickParent()
            var parent2 = pickParent()

            population[populationSize - births-1] = mate(parent1, parent2)
        }        
    }

    function step(){

        initStep()

        playGames()

        calculateFitness()

        killAgents()

        createOffspring()
    }
})


