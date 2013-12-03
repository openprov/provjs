/**
 * Example usages of the ProvJS library
 * 
 * Copyright 2013 University of Southampton - All rights reserved.
 * Licence: To be determined
 */

var prov = require("./prov");

var baseURI = "http://www.example.org/";
var uri = new prov.URI(baseURI + "e1");
var ex = new prov.Namespace("ex", baseURI);
var qname1 = ex.qname("e1");
var qname2 = ex.qname("e2");

console.log(uri.getURI());
console.log(qname1.getURI());

var e1 = new prov.Entity(qname1);
console.log(e1);

var der1 = new prov.Derivation(qname2, qname1);
console.log(der1);

phantom.exit();