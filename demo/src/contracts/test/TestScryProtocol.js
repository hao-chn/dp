var scryProtocol = artifacts.require("./ScryProtocol.sol")
var scryToken = artifacts.require("./ScryToken.sol")

var ptl, ste;
var deployer, seller, buyer, verifier1, verifier2, verifier3, chosenVerfiers, chosenArbitrators;
var publishId, txId;
contract('ScryProtocol', function (accounts) {

    before(function() {
        InitUsers();
    })

    before(function() {
        InitContracts();
    })

    it("Normal procedure with verifier", function () {
        return ptl.publishDataInfo("seqno", "publishId", 1000, "0", ["1", "2"], "2", true, {from: seller}).then(function (result) {
            eventName = "DataPublish";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName);
        }).then(function() {
            //verifier approve that contract transfer deposit
            return ste.approve(ptl.address, 10000, {from: verifier1});
        }).then(function(result) {
            assert(result, "failed to approve contract to transfer deposit"); 
        }).then(function() {
            //register verifier
            return ptl.registerAsVerifier("seqno1", {from: verifier1});
        }).then(function(result) {
            //onRegisterVerifier
            eventName = "RegisterVerifier";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName);
        }).then(function() {
            //verifier approve that contract transfer deposit
            return ste.approve(ptl.address, 10000, {from: verifier2});
        }).then(function(result) {
            assert(result, "failed to approve contract to transfer deposit"); 
        }).then(function() {
            //register verifier
            return ptl.registerAsVerifier("seqno1", {from: verifier2});
        }).then(function(result) {
            //onRegisterVerifier
            eventName = "RegisterVerifier";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName);
        }).then(function() {
            //verifier approve that contract transfer deposit
            return ste.approve(ptl.address, 10000, {from: verifier3});
        }).then(function(result) {
            assert(result, "failed to approve contract to transfer deposit"); 
        }).then(function() {
            //register verifier
            return ptl.registerAsVerifier("seqno1", {from: verifier3});
        }).then(function(result) {
            //onRegisterVerifier
            eventName = "RegisterVerifier";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName);
            ste.approve(ptl.address, 1000, {from: buyer});
        }).then(function() {
            return ptl.createTransaction("seqno3",  "publishId", {from: buyer});
        }).then(function(result) {
            eventName = "TransactionCreate";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName);

            eventName = "VerifiersChosen";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName);

            eventName = "ArbitratorsChosen";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName);

            txId = getEventField("VerifiersChosen", result, "transactionId");
            verifiers = getEventField("VerifiersChosen", result, "users");
            chosenVerfiers = verifiers;
            chosenArbitrators = getEventField("ArbitratorsChosen", result, "users");

            return verifiers;
        }).then(function(result) {
            assert(result.length == 2, "Invalid chosen verifiers")
            return ptl.vote("seqNo4", txId, true, "comments from verifier1", {from: result[0]});
        }).then(function(result) {
            eventName = "Vote";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName);
        }).then(function() {
            return ptl.buyData("seqNo5", txId, {from: buyer});
        }).then(function(result) {
            eventName = "Buy";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName);
        }).then(function() {
            return ptl.submitMetaDataIdEncWithBuyer("seqNo6", txId, "0", {from: seller});
        }).then(function(result) {
            eventName = "ReadyForDownload";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName);
        })/*.then(function() {
            // return ↓
            ptl.confirmDataTruth("seqNO7", txId, true, {from: buyer});
        }).then(function(result) {
            eventName = "TransactionClose";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName);
        })*/.then(function() {
            return ptl.arbitrate("seqNO8", txId, true)
        }).then(function(result) {
            eventName = "Arbitrate";
            assert(checkEvent(eventName, result), "failed to watch event " + eventName)
        }).then(function() {
            ptl.creditsToVerifier(txId, chosenVerfiers[1], 5);
        }).catch(function (err) {
            console.log("catched error:", err)
            assert.fail()            
        })
    })

    function InitContracts() {
        var nc = new Promise(function() {
            scryToken.deployed().then(function (instance) {
                ste = instance;
            }).then(function() {
                scryProtocol.deployed().then(function (instance) {
                    ptl = instance;
                })
            })
        })

        return nc;
    }

    function InitUsers() {
        deployer = accounts[0];
        seller = accounts[1];
        buyer = accounts[2];
        verifier1 = accounts[3];
        verifier2 = accounts[4];
        verifier3 = accounts[5];        
    }
})

function checkEvent(eventName, receipt) {
    for (var i = 0; i < receipt.logs.length; i++) {
        var log = receipt.logs[i];

        if (log.event == eventName) {
            console.log("Event " + eventName + " watched");
            return true;
        }
    }
}

function getEventField(eventName, receipt, fieldName) {
    for (var i = 0; i < receipt.logs.length; i++) {
        var log = receipt.logs[i];

        if (log.event == eventName) {
            return log.args[fieldName];
        }
    }
}