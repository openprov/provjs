/**
 * JavaScript library for PROV.
 * 
 * Copyright 2013 University of Southampton - All rights reserved.
 * Licence: To be determined
 */

/*jshint strict: true */

(function(window, undefined) {
	"use strict";

// Date ISO format
    if ( !Date.prototype.toISOString ) {
        ( function() {

        function pad(number) {
            var r = String(number);
            if ( r.length === 1 ) {
                r = '0' + r;
            }
            return r;
        }
     
        Date.prototype.toISOString = function() {
        	if (this === undefined) {
        		return "";
        	}
            return this.getUTCFullYear()
                + '-' + pad( this.getUTCMonth() + 1 )
                + '-' + pad( this.getUTCDate() )
                + 'T' + pad( this.getUTCHours() )
                + ':' + pad( this.getUTCMinutes() )
                + ':' + pad( this.getUTCSeconds() )
                + '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )
                + 'Z';
        };
        }() );
    }

// URI
function URI(uri) {
	this.uri = uri;
}

URI.prototype.getURI = function() {
	return this.uri;
};


// PROV Qualified Name
function QualifiedName(prefix, localPart, namespaceURI) {
	this.prefix = prefix;
	this.localPart = localPart;
	this.namespaceURI = namespaceURI;
	URI.call(this, namespaceURI + localPart);
}

QualifiedName.prototype = Object.create(URI.prototype);
QualifiedName.prototype.constructor = QualifiedName;
QualifiedName.prototype.toString = function() {
	var ret = this.prefix + ":" + this.localPart;
	return ret;
};
QualifiedName.prototype.equals = function(other) {
	return ((other instanceof QualifiedName)
	        && (this.namespaceURI===other.namespaceURI)
	        && (this.localPart===other.localPart)
	       );
};


// Namespace
function Namespace(prefix, namespaceURI) {
	this.prefix = prefix;
	this.namespaceURI = namespaceURI;
}

Namespace.prototype.qname = function(localPart) {
	var ret = new QualifiedName(this.prefix, localPart, this.namespaceURI);
	return ret;
};

// Literal and data types
function Literal(value, datatype, langtag) {
	this.value = value;
	this.datatype = datatype;
	this.langtag = langtag;
}
Literal.prototype.constructor = Literal;
Literal.prototype.toString = function() {
	// TODO Suport for multi-line strings (triple-quoted)
	// TODO Check for special notation for some data types in PROV-N (e.g. QName)
	return ('"' + this.value + '"' +
			((this.langtag !== undefined) ? ('@' + this.langtag) : (' %% ' + this.datatype)));
};
Literal.prototype.equals = function(other) {
	// TODO check whether this is correct or is too strict
	return ((other instanceof Literal)
	        && (this.value===other.value)
	        && (this.datatype===other.datatype)
	        && (this.langtag===other.langtag) );
};

// Record
function Record() {
    // Parsing the optional attribute-value pairs if the last argument is a list
	this.attributes = [];
    var len = arguments.length;
    if (len > 1 && arguments[len - 1] instanceof Array) {
        // Requiring at least 3 arguments (record-specific first term, an array)
        var attrPairs = arguments[len - 1];
        for (var i = 0, l = attrPairs.length; i < l; i += 2) {
            requireQualifiedName(attrPairs[i]);
            this.setAttr(attrPairs[i], attrPairs[i + 1]);
        }
    }
}
Record.prototype = {
	/* GETTERS & SETTERS */
	// Identifier
	id: function(identifier) {
		this.identifier = identifier;
		return this;
	},
	getId: function() {
		return this.identifier;
	},
	setAttr: function(k, v){
		var i;
		var existing = false;
		var values = this.getAttr(k);
		for(i=0; i<values.length; i++) {
			if (v.equals(values[i])) {
				existing = true;
				continue;
			}
		}
		if (!existing) {
			this.attributes.push([k,v]);
		}
	},

	// Arbitrary attributes
	getAttr: function(attr_name) {
		var results = [];
		for (var i = 0; i < this.attributes.length; i++) {
			if (attr_name.equals(this.attributes[i][0])) {
				results.push(this.attributes[i][1]);
			}
		}
		return results;
	}
};
 
// Element
function Element(identifier) {
	Record.apply(this, arguments);
	this.identifier = identifier;
}
Element.prototype = Object.create(Record.prototype);
Element.prototype.constructor = Element;

// Entity
function Entity(identifier) {
	Element.apply(this, arguments);
}
Entity.prototype = Object.create(Element.prototype);
Entity.prototype.constructor = Entity;
Entity.prototype.provn_name = "entity";
Entity.prototype.toString = function() {
	var output = [];
	output.push(String(this.identifier));
	var attr = this.attributes.map(function(x) {
		return x.join("=");
		}).join(", ");
	if (attr !== "") {
		output.push("["+attr+"]");
	}
	return Entity.prototype.provn_name+"(" + output.join(", ") + ")";
};
// TODO: decide on whether to support Plan

// An activity is something that occurs over a period of time and acts upon or with entities; 
// it may include consuming, processing, transforming, modifying, relocating, using, or generating entities.
// activity(id, st, et, [attr1=val1, ...]) , has:
//     id: an identifier for an activity;
//     startTime: an optional time (st) for the start of the activity;
//     endTime: an optional time (et) for the end of the activity;
//     attributes: an optional set of attribute-value pairs ((attr1, val1), ...) representing additional information about this activity.
function Activity(identifier, st, et) {
	len = arguments.length;
	// TODO: how do we validate dates / times in js? 
	// this.startTime = new Date(Date.parse(st));
	// this.endTime = new Date(Date.parse(et));
	this.startTime = st;
	this.endTime = et;
	Element.apply(this, arguments);
}
Activity.prototype = Object.create(Element.prototype);
Activity.prototype.constructor = Activity;
Activity.prototype.provn_name = "activity";
Activity.prototype.toString = function() {
	var output = [];
	output.push(String(this.identifier));
	output.push(this.startTime.toISOString());
	output.push(this.endTime.toISOString());
	var attr = this.attributes.map(function(x) {
		return x.join("=");
		}).join(", ");
	if (attr !== "") {
		output.push("["+attr+"]");
	}
	return Activity.prototype.provn_name+"(" + output.join(", ") + ")";
};

// An agent is something that bears some form of responsibility for an activity taking place, for the existence of an entity, or for another agent's activity.
// An agent may be a particular type of entity or activity. 
// agent(id, [attr1=val1, ...]), has:
//     id: an identifier for an agent;
//     attributes: a set of attribute-value pairs ((attr1, val1), ...) representing additional information about this agent.
function Agent(identifier) {
	Element.apply(this, arguments);
}
Agent.prototype = Object.create(Element.prototype);
Agent.prototype.constructor = Agent;
Agent.prototype.provn_name = "agent";
Agent.prototype.toString = function() {
	var output = [];
	output.push(String(this.identifier));
	var attr = this.attributes.map(function(x) {
		return x.join("=");
		}).join(", ");
	if (attr !== "") {
		output.push("["+attr+"]");
	}
	return Agent.prototype.provn_name+"(" + output.join(", ") + ")";
};
// TODO: decide on whether to support Person, Organization, SoftwareAgent

// Relation
function Relation() {
    this.properties = {};
    var len = arguments.length;
    if (len > 0) {
        // Processing relation terms
        if (arguments[len - 1] instanceof Array) {
            // Assuming this is the array of attribute-value pairs, ignore it
            len--;
        }
        var terms = this.getPROVTerms();
        for (var i = 0; i < len; i++) {
            this[terms[i]] = arguments[i];
        }
    }
    Record.apply(this, arguments);
}
Relation.prototype = Object.create(Record.prototype);
Relation.prototype.constructor = Relation;
Relation.prototype.toString = function() {
	var that = this;
	var output = [];
    var provTerms = this.getPROVTerms();
    var term0 = this[provTerms[0]]; // The first term should always available
	if (this.identifier) {
		output.push(String(this.identifier) + "; " + term0);
	} else {
		output.push(term0);
	}
	var rel = provTerms.slice(1).map(function(x) {
		return (that[x]) ? that[x] : "-";
	}).join(", ");
    output.push(rel);

	var attr = this.attributes.map(function(x) {
		return x.join("=");
	}).join(", ");
	if (attr !== "") {
		output.push("["+attr+"]");
	}
	return this.provn_name + "(" + output.join(", ") + ")";
};

// Validation functions
// TODO These validation function currently does not allow for reporting which value is offending the rules
function requireQualifiedName(value) {
    if (!(value instanceof QualifiedName)) {
        throw new Error("Expected a prov.QualifiedName value");
    }
}
function requireDate(value) {
    if (!(value instanceof Date)) {
        throw new Error("Expected a Date value");
    }
}

function defineProp(obj, propName, validator) {
    Object.defineProperty(obj, propName, {
        get: function () {
          if (propName in this.properties)
              return this.properties[propName];
          else
              return undefined;
        },
        set: function (newValue) {
            validator(newValue);
            this.properties[propName] = newValue;
        }
    })
}

function definePROVRelation(cls, provn_name, from, to, extras) {
    var proto = Object.create(Relation.prototype);
    proto.constructor = cls;
    proto.provn_name = provn_name;
    var provTerms = [from, to];
    // The first two terms are always required to be QualifiedName
    cls.from = from;
    cls.to = to;
    cls.extras = extras;
    defineProp(proto, from, requireQualifiedName);
    defineProp(proto, to, requireQualifiedName);
    if (extras !== undefined) {
        for (var i = 0; i < extras.length; i++) {
            var term = extras[i];
            provTerms.push(term[0]);
            defineProp(proto, term[0], term[1]);
        }
    }
    Object.freeze(provTerms); // Prevent this array from being modified
    proto.getPROVTerms = function () {
        return provTerms; // returning the array above to avoid the same array being duplicated in every relation of the same type
    }
    cls.prototype = proto;
    return cls;
}

// Generation is the completion of production of a new entity by an activity. 
// This entity did not exist before generation and becomes available for usage after this generation.
// Given that a generation is the completion of production of an entity, it is instantaneous.
// wasGeneratedBy(id; e, a, t, attrs) , has:
//     id: an optional identifier for a generation;
//     entity: an identifier (e) for a created entity;
//     activity: an optional identifier (a) for the activity that creates the entity;
//     time: an optional "generation time" (t), the time at which the entity was completely created;
//     attributes: an optional set (attrs) of attribute-value pairs representing additional information about this generation.
// While each of id, activity, time, and attributes is optional, at least one of them must be present.
function Generation(entity, activity) {
    Relation.apply(this, arguments);
}
// TODO: activity is optional in the standard but mandatory here
definePROVRelation(Generation,
    "wasGeneratedBy", "entity", "activity", [
        ["time", requireDate]    ]
);

// Usage is the beginning of utilizing an entity by an activity. 
// Before usage, the activity had not begun to utilize this entity and could not have been affected by the entity. 
// Given that a usage is the beginning of utilizing an entity, it is instantaneous.
// used(id; a, e, t, attrs), has:
//     id: an optional identifier for a usage;
//     activity: an identifier (a) for the activity that used an entity;
//     entity: an optional identifier (e) for the entity being used;
//     time: an optional "usage time" (t), the time at which the entity started to be used;
//     attributes: an optional set (attrs) of attribute-value pairs representing additional information about this usage.
// While each of id, entity, time, and attributes is optional, at least one of them must be present.
function Usage(activity, entity) {
    Relation.apply(this, arguments);
}
// TODO: entity is optional in the standard but mandatory here
definePROVRelation(Usage,
    "used", "activity", "entity", [
        ["time", requireDate]
    ]
);

// Communication is the exchange of some unspecified entity by two activities, one activity using some entity generated by the other.
// A communication implies that activity a2 is dependent on another a1, by way of some unspecified entity that is generated by a1 and used by a2.
// wasInformedBy(id; a2, a1, attrs), has:
//     id: an optional identifier identifying the relation;
//     informed: the identifier (a2) of the informed activity;
//     informant: the identifier (a1) of the informant activity;
//     attributes: an optional set (attrs) of attribute-value pairs representing additional information about this communication.
function Communication(informed, informant) {
    Relation.apply(this, arguments);
}
definePROVRelation(Communication,
    "wasInformedBy", "informed", "informant" 
);

// Start is when an activity is deemed to have been started by an entity, known as trigger. 
// The activity did not exist before its start. 
// Any usage, generation, or invalidation involving an activity follows the activity's start. 
// A start may refer to a trigger entity that set off the activity, or to an activity, known as starter, that generated the trigger.
// Given that a start is when an activity is deemed to have started, it is instantaneous.
// wasStartedBy(id; a2, e, a1, t, attrs), has:
//     id: an optional identifier for the activity start;
//     activity: an identifier (a2) for the started activity;
//     trigger: an optional identifier (e) for the entity triggering the activity;
//     starter: an optional identifier (a1) for the activity that generated the (possibly unspecified) entity (e);
//     time: the optional time (t) at which the activity was started;
//     attributes: an optional set (attrs) of attribute-value pairs representing additional information about this activity start.
// While each of id, trigger, starter, time, and attributes is optional, at least one of them must be present.
function Start(activity, trigger) {
	Relation.apply(this, arguments);
}
// TODO: triggerEntity and starterActivity are both optional as long as one of them is present
definePROVRelation(Start,
	"wasStartedBy", "activity", "trigger", [
		["starter", requireQualifiedName],
		["time", requireDate]
	]
);

// End is when an activity is deemed to have been ended by an entity, known as trigger. 
// The activity no longer exists after its end. 
// Any usage, generation, or invalidation involving an activity precedes the activity's end. 
// An end may refer to a trigger entity that terminated the activity, or to an activity, known as ender that generated the trigger.
// Given that an end is when an activity is deemed to have ended, it is instantaneous.
// wasEndedBy(id; a2, e, a1, t, attrs), has:
//     id: an optional identifier for the activity end;
//     activity: an identifier (a2) for the ended activity;
//     trigger: an optional identifier (e) for the entity triggering the activity ending;
//     ender: an optional identifier (a1) for the activity that generated the (possibly unspecified) entity (e);
//     time: the optional time (t) at which the activity was ended;
//     attributes: an optional set (attrs) of attribute-value pairs representing additional information about this activity end.
// While each of id, trigger, ender, time, and attributes is optional, at least one of them must be present.
function End(activity, trigger) {
	Relation.apply(this, arguments);
}
// TODO: triggerEntity and enderActivity are both optional as long as one of them is present
definePROVRelation(End,
	"wasEndedBy", "activity", "trigger", [
		["ender", requireQualifiedName],
		["time", requireDate]
	]
);

// Invalidation is the start of the destruction, cessation, or expiry of an existing entity by an activity. 
// The entity is no longer available for use (or further invalidation) after invalidation. 
// Any generation or usage of an entity precedes its invalidation.
// Given that an invalidation is the start of destruction, cessation, or expiry, it is instantaneous.
// wasInvalidatedBy(id; e, a, t, attrs), has:
//     id: an optional identifier for a invalidation;
//     entity: an identifier for the invalidated entity;
//     activity: an optional identifier for the activity that invalidated the entity;
//     time: an optional "invalidation time", the time at which the entity began to be invalidated;
//     attributes: an optional set of attribute-value pairs representing additional information about this invalidation.
// While each of id, activity, time, and attributes is optional, at least one of them must be present.
function Invalidation(entity, activity) {
    Relation.apply(this, arguments);
}
// TODO: activity is optional in the spec but mandatory here
definePROVRelation(Invalidation,
    "wasInvalidatedBy", "entity", "activity", [
        ["time", requireDate]    
    ]
);

function Derivation(generatedEntity, usedEntity) {
    Relation.apply(this, arguments);
}
definePROVRelation(Derivation,
    "wasDerivedFrom", "generatedEntity", "usedEntity", [
        ["activity", requireQualifiedName],
        ["generation", requireQualifiedName],
        ["usage", requireQualifiedName]
    ]
);

// TODO: Revision, Quotation, PrimarySource

// A revision is a derivation for which the resulting entity is a revised version of some original.
// The implication here is that the resulting entity contains substantial content from the original. 
// A revision relation is a kind of derivation relation from a revised entity to a preceding entity. 
// The type of a revision relation is denoted by: prov:Revision. PROV defines no revision-specific attributes.
// wasDerivedFrom(e1, e2, [ prov:type='prov:Revision' ])

// A quotation is the repeat of (some or all of) an entity, such as text or image, by someone who may or may not be its original author.
// A quotation relation is a kind of derivation relation, for which an entity was derived from a preceding entity by copying, or "quoting", some or all of it. 
// The type of a quotation relation is denoted by: prov:Quotation. PROV defines no quotation-specific attributes.
// wasDerivedFrom(e1, e2, [ prov:type='prov:Quotation' ])

// A primary source for a topic refers to something produced by some agent with direct experience and knowledge about the topic, at the time of the topic's study, without benefit from hindsight.
// A primary source relation is a kind of a derivation relation from secondary materials to their primary sources. 
// It is recognized that the determination of primary sources can be up to interpretation, and should be done according to conventions accepted within the application's domain. 
// The type of a primary source relation is denoted by: prov:PrimarySource. PROV defines no attributes specific to primary source.
// wasDerivedFrom(e1, e2, [ prov:type='prov:PrimarySource' ])

function Attribution(entity, agent) {
    Relation.apply(this, arguments);
}
definePROVRelation(Attribution,
    "wasAttributedTo", "entity", "agent"
);

// An activity association is an assignment of responsibility to an agent for an activity, indicating that the agent had a role in the activity. 
// wasAssociatedWith(id; a, ag, pl, attrs), has:
//     id: an optional identifier for the association between an activity and an agent;
//     activity: an identifier (a) for the activity;
//     agent: an optional identifier (ag) for the agent associated with the activity;
//     plan: an optional identifier (pl) for the plan the agent relied on in the context of this activity;
//     attributes: an optional set (attrs) of attribute-value pairs representing additional information about this association of this activity with this agent.
// While each of id, agent, plan, and attributes is optional, at least one of them must be present.
function Association(activity, agent) {
	Relation.apply(this, arguments);
}
definePROVRelation(Association, 
	"wasAssociatedWith", "activity", "agent", [
		["plan", requireQualifiedName]
	]
);

// Delegation is the assignment of authority and responsibility to an agent (by itself or by another agent) to carry out a specific activity as a delegate or representative, while the agent it acts on behalf of retains some responsibility for the outcome of the delegated work.
// actedOnBehalfOf(id; ag2, ag1, a, attrs), has:
//     id: an optional identifier for the delegation link between delegate and responsible;
//     delegate: an identifier (ag2) for the agent associated with an activity, acting on behalf of the responsible agent;
//     responsible: an identifier (ag1) for the agent, on behalf of which the delegate agent acted;
//     activity: an optional identifier (a) of an activity for which the delegation link holds;
//     attributes: an optional set (attrs) of attribute-value pairs representing additional information about this delegation link.
function Delegation(delegate, responsible) {
	Relation.apply(this, arguments);
}
definePROVRelation(Delegation, 
	"actedOnBehalfOf", "delegate", "responsible", [ 
		["activity", requireQualifiedName]
	] 
);

// Influence is the capacity of an entity, activity, or agent to have an effect on the character, development, or behavior of another by means of usage, start, end, generation, invalidation, communication, derivation, attribution, association, or delegation.
// An influence relation between two objects o2 and o1 is a generic dependency of o2 on o1 that signifies some form of influence of o1 on o2.
// wasInfluencedBy(id; o2, o1, attrs), has:
//     id: an optional identifier identifying the relation;
//     influencee: an identifier (o2) for an entity, activity, or agent;
//     influencer: an identifier (o1) for an ancestor entity, activity, or agent that the former depends on;
//     attributes: an optional set (attrs) of attribute-value pairs representing additional information about this relation.
function Influence(influencee, influencer) {
    Relation.apply(this, arguments);
}
definePROVRelation(Influence,
    "wasInfluencedBy", "influencee", "influencer"
);

// An entity that is a specialization of another shares all aspects of the latter, and additionally presents more specific aspects of the same thing as the latter. 
// In particular, the lifetime of the entity being specialized contains that of any specialization.
// specializationOf(infra, supra), has:
//     specificEntity: an identifier (infra) of the entity that is a specialization of the general entity (supra);
//     generalEntity: an identifier (supra) of the entity that is being specialized.
// A specialization is not, as defined here, also an influence, and therefore does not have an id and attributes.
function Specialization(specificEntity, generalEntity) {
    Relation.apply(this, arguments);
}
// TODO: delete the identifier and the attributes 
definePROVRelation(Specialization,
    "specializationOf", "specificEntity", "generalEntity"
);

// Two alternate entities present aspects of the same thing. These aspects may be the same or different, and the alternate entities may or may not overlap in time.
// alternateOf(e1, e2), has:
//     alternate1: an identifier (e1) of the first of the two entities;
//     alternate2: an identifier (e2) of the second of the two entities.
// An alternate is not, as defined here, also an influence, and therefore does not have an id and attributes.
function Alternate(alternate1, alternate2) {
    Relation.apply(this, arguments);
}
// TODO: delete the identifier and the attributes 
definePROVRelation(Alternate,
    "alternateOf", "alternate1", "alternate2"
);

// TODO: Collection and EmptyCollection - do we define special classes for them?

// A membership relation is defined for stating the members of a Collection.
// Membership is the belonging of an entity to a collection.
// hadMember(c, e), has:
//     collection: an identifier (c) for the collection whose member is asserted;
//     entity: the identifier e of an entity that is member of the collection.
// Membership is not, as defined here, also an influence, and therefore does not have an id and attributes.
function Membership(collection, entity) {
    Relation.apply(this, arguments);
}
// TODO: delete the identifier and the attributes 
definePROVRelation(Membership,
    "hadMember", "collection", "entity"
);

// TODO: Bundles

var uniqueIDCount = 0;
function getUniqueID(obj) {
    // Generating unique identifiers for PROV-JSON export
    var ret;
    if (obj.getId !== undefined && (ret = obj.getId()) !== undefined) {
        // Return the existing identifier
        return ret.toString();
    }
    if (obj.__provjson_id === undefined) {
        obj.__provjson_id = "_:id" + (++uniqueIDCount);

    }
    return obj.__provjson_id;
}

function Document() {
	this.statements = new Array();
    // this.statements = statements.slice(); // Cloning the list of statements
    // TODO Collect all namespaces used in various QualifiedName to define in the prefix block
    // This can also be done in when a document is exported to PROV-N or PROV-JSON
}

Document.prototype = {
    constructor: Document,
    buildPROVJSON: function () {
        // TODO implement following _encode_JSON_container()
        // (See https://github.com/trungdong/prov/blob/master/prov/model/__init__.py#L1375)
        var container = {};
        for (var i = 0, l = this.statements.length; i < l; i++) {
            var statement = this.statements[i];
            var id = getUniqueID(statement);
            var stJSON = {};
            if (statement instanceof Relation) {
                var terms = statement.getPROVTerms();
                for (var j = 0; j < terms.length; j++) {
                    if (statement[terms[j]] !== undefined) {
                        stJSON["prov:" + terms[j]] = statement[terms[j]].toString();
                    }
                }
            }
            // TODO Export attribute-value pairs (and startTime, endTime for activities)
            if (container[statement.provn_name] === undefined) {
                container[statement.provn_name] = {};
            }
            container[statement.provn_name][id] = stJSON;
        }
        return container;
    },
	addStatement: function(statement) {
		this.statements.push(statement);
	},
};

var provNS = new Namespace("prov", "http://www.w3.org/ns/prov#");
var xsdNS = new Namespace("xsd", "http://www.w3.org/2000/10/XMLSchema#");
xsdNS.QName = xsdNS.qname("QName");

// Factory class
function ProvJS(scope, parent) {
	// The factory class
    this.scope = (scope !== undefined) ? scope : new Document(); // TODO: Should this create a new document instead?
    this.parent = parent;
}

function rel_maker(cls) {
	var fn = function() {
		var statement, parameters;
		var usable_args = arguments.length;
		var pos, attributes;
		if (usable_args < 2) {
			return undefined;
		}
		if (Array.isArray(arguments[usable_args-1])) {
			usable_args = usable_args-1;
		}
		parameters = [this.getValidQualifiedName(arguments[0]), this.getValidQualifiedName(arguments[1])];
		for(pos = 0; (pos < cls.extras.length) && ((pos+2) < usable_args); pos++) {
			if (cls.extras[pos][1] === requireQualifiedName) {
				parameters.push(this.getValidQualifiedName(arguments[pos+2]));
			} else
			if (cls.extras[pos][1] === requireDate) {
				parameters.push(this.getValidDate(arguments[pos+2]));
			}
		}
		statement = Object.create(cls.prototype);
		statement = (cls.apply(statement, parameters) || statement);
		if (Array.isArray(arguments[arguments.length-1])) {
			attributes = arguments[arguments.length-1];
			for (pos = 1; pos < arguments.length; pos += 2) {
				statement.setAttr(this.getValidQualifiedName(attributes[pos - 1]), this.getValidLiteral(attributes[pos]));
			}
		}
		this.addStatement(statement);
		var newProvJS = new ProvJS(statement, this);
		return newProvJS;
	};
	return fn;
}

function Bundle(identifier) {
	Document.apply(this, arguments);
	this.identifier = identifier;
}

Bundle.prototype = Object.create(Document.prototype);
Bundle.prototype.constructor = Document;

ProvJS.prototype = {
    // Exposing classes via the ProvJS class
	URI: URI,
	QualifiedName: QualifiedName,
	Literal: Literal,
	Record: Record,
	Element: Element,
	Entity: Entity,
	Bundle: Bundle,
	Relation: Relation,
	Derivation: Derivation,
	Attribution: Attribution,

    // All registered namespaces
	namespaces: {
		"prov": provNS,
		"xsd": xsdNS
	},
	// The PROV namespace
	ns: provNS,
	parent: undefined,
	constructor: ProvJS,

	addNamespace: function(ns_or_prefix, uri) {
		var ns;
		if (ns_or_prefix instanceof Namespace) {
			ns = ns_or_prefix;
		} else {
			ns = new Namespace(ns_or_prefix, uri);
		}
        var namespaces = (this.scope instanceof Record) ? this.parent.namespaces : this.namespaces;
		namespaces[ns.prefix] = ns;
		return ns;
	},
	getValidQualifiedName: function(identifier) {
		if (identifier instanceof QualifiedName) {
			return identifier;
		}

        var namespaces = (this.scope instanceof Record) ? this.parent.namespaces : this.namespaces;

		// If id_str has a colon (:), check if the part before the colon is a registered prefix
		var components = identifier.split(":", 2);
		if (components.length === 2) {
			var prefix = components[0];
			if (prefix in namespaces) {
				return namespaces[prefix].qname(components[1]);
			}
		}
			
		// TODO If a default namespace is registered, use it

		throw new Error("Cannot validate identifier:", identifier);
		return identifier;
	},
	literal: function(value, datatype, langtag) {
		// Determine the data type for common types
		if ((datatype === undefined) && (langtag === undefined)) {
			// Missing both datatype and langtag
			if (typeof value === "string") {
				datatype = xsdNS.qname("string");
			} else
			if (typeof value === 'number') {
				if (Math.floor(value) === value) {
					datatype = xsdNS.qname("int");
				} else {
					datatype = xsdNS.qname("float");
				}
			} else
			if (typeof value === 'boolean') {
					datatype = xsdNS.qname("boolean");
			} else
			if (value instanceof Date) {
				value = value.toISOString();
				datatype = xsdNS.qname("dateTime");
			} else
			if (value instanceof QualifiedName) {
				datatype = xsdNS.QName;
			}
		} else {
			if (datatype !== undefined) {
				datatype = this.getValidQualifiedName(datatype);
				
				if (datatype.equals(xsdNS.QName)) {
					// Try to ensure a QualifiedName value
					value = this.getValidQualifiedName(value);
				}
			}
			// TODO Handle with langtag and undefined datatype
		}
		var ret = new Literal(value, datatype, langtag);
		return ret;
	},
	getValidLiteral: function(literal) {
		if (literal instanceof Literal) {
			return literal;
		}
		var ret;
		if (Array.isArray(literal)) {
			// Accepting literal as an array of [value, datatype, lang]
			ret = this.literal.apply(this, literal);
		}
		else
			// Accepting literal as a simple-type value 
			ret = this.literal(literal);
		return ret;
	},
	getValidDate: function(dt) {
		var ret;
		if (dt instanceof Date) {
			ret = new Date(dt);
		} else if (typeof dt === "string" ) {
			ret = new Date(Date.parse(dt));			
		} else if (typeof dt === "number" ) {
			ret = new Date(dt);
		}
		return ret;
	},

	// PROV statements
    addStatement: function(statement) {
        // Add the statement to the current bundle
        var bundle = (this.scope instanceof Record) ? this.parent.scope : this.scope;
        bundle.addStatement(statement);
    },

    document: function() {
    	// Allow prov.document()
    	if(this.scope !== undefined) {
			throw new Error("Unable to call this method here.");
    	}
    	return new ProvJS();
    },

    bundle: function(identifier) {
		// Allow prov.bundle() or prov.document().bundle()
		this._documentOnly();
		if(this.scope instanceof Bundle) {
			throw new Error("Unable to call this method on a bundle.");
		}
    	var eID = this.getValidQualifiedName(identifier);
    	var newBundle = new Bundle(eID);
    	var newProvJS = new ProvJS(newBundle, this);
    	return newProvJS;
    },

    _setProp: function(property, identifier) {
        var eID = this.getValidQualifiedName(identifier);
		if (this.scope instanceof Record) {
            // Setting the entity attribute
            this._propertyGuard(property);
            this.scope[property] = eID;
            return this;
        }
        else {
			throw new Error("Unable to access this property here.");
        }
    },

	entity: function(identifier) {
        if (this.scope instanceof Record) {
        	return this._setProp('entity', identifier);
        }
        else {
        	this._documentOnly();
        	var eID = this.getValidQualifiedName(identifier);
            var newEntity = new Entity(eID);
            this.addStatement(newEntity);
            var newProvJS = new ProvJS(newEntity, this);
            return newProvJS;
        }
	},
	agent: function(identifier) {
        if (this.scope instanceof Record) {
        	return this._setProp('agent', identifier);
        }
        else {
        	this._documentOnly();
        	var eID = this.getValidQualifiedName(identifier);
            var newAgent = new Agent(eID);
            this.addStatement(newAgent);
            var newProvJS = new ProvJS(newAgent, this);
            return newProvJS;
        }
	},
	activity: function(identifier, startTime, endTime) {
        if (this.scope instanceof Record) {
        	return this._setProp('activity', identifier);
        }
        else {
        	this._documentOnly();
        	var eID = this.getValidQualifiedName(identifier);
        	// TODO: get the start time and end time from the list of arguments
        	if (startTime !== undefined)
	        	startTime = this.getValidDate(startTime);
        	if (endTime !== undefined)
	        	endTime = this.getValidDate(endTime);
            var newActivity = new Activity(eID, startTime, endTime);
            this.addStatement(newActivity);
            var newProvJS = new ProvJS(newActivity, this);
            return newProvJS;
        }
	},

	_propertyGuard: function(property) {
		console.log("Can we access "+property+" in ");
		console.log(this.scope);
		if(!(property in this.scope)) {
			throw new Error("Unable to access this property here.");
		}
	},

	_documentOnly: function() {
		if(!(this.scope instanceof Document)) {
			throw new Error("Unable to call this method here.");
		}
	},

	wasDerivedFrom: rel_maker(Derivation),
    wasAttributedTo: function(entity, agent) {
		this._documentOnly();
        var statement = new Attribution(this.getValidQualifiedName(entity), this.getValidQualifiedName(agent));
        // TODO Handle optional attribute-value pairs
        this.addStatement(statement);
        var newProvJS = new ProvJS(statement, this);
        return newProvJS;
    },
    // Setting properties
    attr: function(attr_name, attr_value) {
		var context = this.scope;
		if (context===undefined) {
			return(undefined);
		}
		if (attr_value === undefined) {
    		// Overloading this with getter behaviour
			return context.getAttr(this.getValidQualifiedName(attr_name));
		}
		var name = this.getValidQualifiedName(attr_name);
		var value = this.getValidLiteral(attr_value);
		context.setAttr(name, value);
		return this;
	},
	id: function() {
		var context = this.scope;
		if (context === undefined) {
			return(undefined);
		}
		if (arguments.length == 0) {
			return context.id();
		} else {
			context.id(this.getValidQualifiedName(arguments[0]));
			return(this);
		}
	},

	// TODO prov:label
	// TODO prov:type
	// TODO prov:value
	// TODO prov:location
	// TODO prov:role

	// TODO Collect all created records
	toString: function() {
        if (this.scope instanceof Record)
            return 'ProvJS(' + this.scope + ')';
        else
		    return 'ProvJS(' + this.scope.statements.join(", ") + ')';
	},

};

var props = ['delegate',
	'responsible',
    'informedActivity',
    'informantActivity',
	'starterActivity',
    'endedActivity',
    'enderActivity',
    'invalidatingActivity',
    'usedEntity',
    'generatedEntity',
    'triggerEntity',
    'invalidatedEntity',
    'specificEntity',
    'generalEntity',
    'alternate1',
    'alternate2',
    'collection',
    'member',
    'responsible'
    ];

function createFunc(prop) {
	return function(identifier) {
		return this._setProp(prop, identifier);
	};
}

for(var i=0; i<props.length; i++) {
	var prop = props[i];
	ProvJS.prototype[prop] = createFunc(prop);
}

// This is the default ProvJS object
var rootProvJS = new ProvJS();

// Registering the prov object with the environment
if (typeof module === "object" && module && typeof module.exports === "object") {
	// Common.JS environments (e.g. node.js, PhantomJS)
	module.exports = rootProvJS;
} else {
	// Asynchronous module definition (AMD)
	if (typeof define === "function" && define.amd) {
		define( "prov", [], function () { return rootProvJS; } );
	}
}

if (typeof window === "object" && typeof window.document === "object") {
	// Browser environments
	window.prov = rootProvJS;
}

})(window);
