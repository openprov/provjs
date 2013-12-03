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


// Namespace
function Namespace(prefix, namespaceURI) {
	this.prefix = prefix;
	this.namespaceURI = namespaceURI;
};

Namespace.prototype.qname = function(localPart) {
	var ret = new QualifiedName(this.prefix, localPart, this.namespaceURI);
	return ret;
};
exports.Namespace = Namespace;

// Literal and data types
function Literal(value, datatype, langtag) {
	this.value = value;
	this.datatype = datatype;
	this.langtag = langtag;
};
exports.Literal = Literal;


// Element
function Element(id, attr_value_pairs) {
	this.id = id;
	this.extra = [];
	if (attr_value_pairs && attr_value_pairs.length) {
		for (var i = 0; i < attr_value_pairs.length; i++) {
			var pair = attr_value_pairs[i];
			// TODO check the validity of attribute-value pair
			this.extra.push(pair);
		}
	}
};


// Entity
function Entity(id) {
	// This is an entity
};
Entity.prototype = new Element;
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