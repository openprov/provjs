/**
 * Example usages of the ProvJS library
 * 
 * Copyright 2013 University of Southampton - All rights reserved.
 * Licence: To be determined
 */

var prov = require("./prov");

//Create a ProvJS Utility
var pu = new prov.Utility;

// Register a namespace
var ex = pu.addNamespace("ex", "http://www.example.org/");

var e1 = pu.entity("ex:e1");
console.log(e1);
console.log(""+e1);

var der1 = pu.wasDerivedFrom("ex:e2", "ex:e1");
der1.attr(prov.ns.qname("type"), prov.ns.qname("Revision"));
console.log(der1);
console.log(""+der1);

console.log(der1.attr(prov.ns.qname("type")));

var der2 = pu.wasDerivedFrom("ex:e2", "ex:e1", prov.ns.qname("type"), prov.ns.qname("Revision"));
console.log(der2);
console.log(""+der2);

phantom.exit();
