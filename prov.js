/**
 * JavaScript library for PROV.
 * 
 * Copyright 2013 University of Southampton - All rights reserved.
 * Licence: To be determined
 */


// URI

function URI(uri) {
	this.uri = uri;
};

URI.prototype.getURI = function() {
	return this.uri;
};

exports.URI = URI;


// PROV Qualified Name
function QualifiedName(prefix, localPart, namespaceURI) {
	this.prefix = prefix;
	this.localPart = localPart;
	this.namespaceURI = namespaceURI;
	URI.call(this, namespaceURI + localPart);
};

QualifiedName.prototype = new URI;
QualifiedName.prototype.constructor = QualifiedName;
QualifiedName.prototype.toString = function() {
	var ret = this.prefix + ":" + this.localPart;
	return ret;
};
exports.QualifiedName = QualifiedName;

// Element
function Element() {
	// This is an element
};



// Entity
function Entity(id) {
	this.id = id;
};
Entity.prototype.toString = function() {
	var ret = "entity(" + this.id + ")";
	return ret;
};
exports.Entity = Entity;


// Derivation
function Derivation(generatedEntityID, usedEntityID) {
	this.generatedEntityID = generatedEntityID;
	this.usedEntityID = usedEntityID;
}
Derivation.prototype.toString = function() {
	var ret = "wasDerivedFrom(" + this.generatedEntityID + ", " + this.usedEntityID + ")";
	return ret;
};
exports.Derivation = Derivation;