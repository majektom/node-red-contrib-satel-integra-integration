[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) [![Build Status](https://travis-ci.org/majektom/node-red-contrib-satel-integra-integration.svg?branch=master)](https://travis-ci.org/majektom/node-red-contrib-satel-integra-integration) [![Coverage Status](https://coveralls.io/repos/github/majektom/node-red-contrib-satel-integra-integration/badge.svg?branch=master)](https://coveralls.io/github/majektom/node-red-contrib-satel-integra-integration?branch=master)

# node-red-contrib-satel-integra-integration

Node-red nodes facilitating integration with Satel Integra alarm/home automation system.

## Description

The nodes contained in the package allow to integrate Satel Integra alarm/home automation system in Node-red flows. The nodes communicate with the Integra control unit via the [ETHM-1 Plus](https://www.satel.pl/en/produktid/947) module using the [Satel Integra integration protocol](https://support.satel.eu/manuals/download?id=8575).

## Installation

You can install the node by the node-red's palette manager or by executing the following command in your node-red's home directory:

```bash
npm install node-red-contrib-satel-integra-integration
```

## Usage

There are three main nodes in the package, each serving different role:

* **satel-integra-encoder** - takes flow messages on input, turns them into respective protocol frames and outputs encoded frame in message's payload.
* **satel-integra-connection** - establishes TCP connection with the [ETHM-1 Plus](https://www.satel.pl/en/produktid/947) module, sends frames incoming in flow messages to the [ETHM-1 Plus](https://www.satel.pl/en/produktid/947) module (optionally encrypting data), receives frames from the [ETHM-1 Plus](https://www.satel.pl/en/produktid/947) module (optionally decrypting data) and outputs flow messages containing frames in the payload.
* **satel-integra-decoder** - takes flow messages containing frames in the payload, decode them and outputs flow messages containing decoded information from the Integra system.

Information on how to properly form an input message for a given Integra system function and how to interpret an output message containing information from the Integra system can be found in the help window of respective node (in the Node-red admin panel). Some knowledge of the Satel Integra system itself and the [Satel Integra integration protocol](https://support.satel.eu/manuals/download?id=8575) may be necessary to understand how to form outgoing and how to interpret incoming messages.

## Examples

### Zone's violation state

This example flow injects *new_data* command every second to detect any change in the system. When it detects a change in zones violation state, it sends *zones_violation* command to get current zones violation state. If the violation state of the **zone 10** has changed, a message with the current state of the zone is being sent to the debug node.

**Note**: The Integra system indexes zones, outputs, partitions, etc. starting from index 1, so all indices in message arrays are shifted by -1 (i.e. `index in the array` == `Integra index - 1`).

![zone violation state example](https://github.com/majektom/node-red-contrib-satel-integra-integration/raw/master/doc/images/zone_violation_example_flow.png "Zone's violation state example")

<details>
  <summary>Click to expand the flow</summary>

  ```json
[
    {
        "id": "9af0b26d.281a98",
        "type": "tab",
        "label": "Zone violation state example",
        "disabled": false,
        "info": ""
    },
    {
        "id": "7bc5c9d4.c377d",
        "type": "satel-integra-encoder",
        "z": "9af0b26d.281a98",
        "name": "Encode",
        "user": "",
        "prefix": "",
        "x": 420,
        "y": 160,
        "wires": [
            [
                "8c9cad45.4f9e88"
            ]
        ]
    },
    {
        "id": "fb75d997.1416e",
        "type": "satel-integra-decoder",
        "z": "9af0b26d.281a98",
        "name": "Decode",
        "x": 800,
        "y": 160,
        "wires": [
            [
                "afb1ba41.f786"
            ]
        ]
    },
    {
        "id": "8c9cad45.4f9e88",
        "type": "satel-integra-connection",
        "z": "9af0b26d.281a98",
        "name": "",
        "server_address": "10.0.0.10",
        "server_port": "7094",
        "encryption": false,
        "max_message_queue_size": "128",
        "x": 610,
        "y": 160,
        "wires": [
            [
                "fb75d997.1416e"
            ]
        ]
    },
    {
        "id": "468ae8ba.8c958",
        "type": "inject",
        "z": "9af0b26d.281a98",
        "name": "new_data command",
        "props": [
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "1",
        "crontab": "",
        "once": true,
        "onceDelay": "5",
        "topic": "new_data",
        "x": 220,
        "y": 180,
        "wires": [
            [
                "7bc5c9d4.c377d"
            ]
        ]
    },
    {
        "id": "afb1ba41.f786",
        "type": "switch",
        "z": "9af0b26d.281a98",
        "name": "Answer switch",
        "property": "topic",
        "propertyType": "msg",
        "rules": [
            {
                "t": "eq",
                "v": "new_data",
                "vt": "str"
            },
            {
                "t": "eq",
                "v": "zones_violation",
                "vt": "str"
            }
        ],
        "checkall": "false",
        "repair": false,
        "outputs": 2,
        "x": 960,
        "y": 160,
        "wires": [
            [
                "acd13d11.baba6"
            ],
            [
                "3cdc6648.688c72"
            ]
        ]
    },
    {
        "id": "acd13d11.baba6",
        "type": "switch",
        "z": "9af0b26d.281a98",
        "name": "new_data switch",
        "property": "payload",
        "propertyType": "msg",
        "rules": [
            {
                "t": "jsonata_exp",
                "v": "payload[0]",
                "vt": "jsonata"
            }
        ],
        "checkall": "true",
        "repair": false,
        "outputs": 1,
        "x": 560,
        "y": 80,
        "wires": [
            [
                "55d578b9.376a58"
            ]
        ],
        "outputLabels": [
            "zones_violation"
        ]
    },
    {
        "id": "55d578b9.376a58",
        "type": "change",
        "z": "9af0b26d.281a98",
        "name": "zones_violation command",
        "rules": [
            {
                "t": "set",
                "p": "topic",
                "pt": "msg",
                "to": "zones_violation",
                "tot": "str"
            }
        ],
        "action": "",
        "property": "",
        "from": "",
        "to": "",
        "reg": false,
        "x": 210,
        "y": 140,
        "wires": [
            [
                "7bc5c9d4.c377d"
            ]
        ]
    },
    {
        "id": "3cdc6648.688c72",
        "type": "change",
        "z": "9af0b26d.281a98",
        "name": "Set violation (zone_10)",
        "rules": [
            {
                "t": "set",
                "p": "payload",
                "pt": "msg",
                "to": "{\"violated\": msg.payload[9]}",
                "tot": "jsonata"
            }
        ],
        "action": "",
        "property": "",
        "from": "",
        "to": "",
        "reg": false,
        "x": 480,
        "y": 240,
        "wires": [
            [
                "f6b617e9.f983a8"
            ]
        ]
    },
    {
        "id": "f6b617e9.f983a8",
        "type": "rbe",
        "z": "9af0b26d.281a98",
        "name": "",
        "func": "rbe",
        "gap": "",
        "start": "",
        "inout": "out",
        "property": "payload",
        "x": 650,
        "y": 240,
        "wires": [
            [
                "19746468.4e91fc"
            ]
        ]
    },
    {
        "id": "19746468.4e91fc",
        "type": "debug",
        "z": "9af0b26d.281a98",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 790,
        "y": 240,
        "wires": []
    },
    {
        "id": "f0ae6b9d.9dc71",
        "type": "comment",
        "z": "9af0b26d.281a98",
        "name": "",
        "info": "# Zone's violation state\n\nThis example flow injects *new_data* command every second to detect any change in the system. When it detects a change in zones violation state, it sends *zones_violation* command to get current zones violation state. If the violation state of the **zone 10** has changed, a message with the current state of the zone is being sent to the debug node.\n\n**Note**: The Integra system indexes zones, outputs, partitions, etc. starting from index 1, so all indices in message arrays are shifted by -1 (i.e. `index in the array` == `Integra index - 1`).\n",
        "x": 560,
        "y": 40,
        "wires": []
    }
]
  ```

</details>

### Set output and get its state

This example flow provides two inject nodes by means of which the user can switch on or off **output 17**. Additionally, *new_data* command is injected every second to detect any change in the system. When it detects a change in outputs state, it sends *outputs_state* command to get current outputs state. If the state of the **output 17** has changed, a message with the current state of the output is being sent to the debug node.

**Note**: The Integra system indexes zones, outputs, partitions, etc. starting from index 1, so all indices in message arrays are shifted by -1 (i.e. `index in the array` == `Integra index - 1`).

**Note**: Every command changing the system state requires authorization. Therefore, the encode node has the **User** field set to *My_user* configuration node. In order to make the example work in user's system, the user has to set valid user code in the **Code** filed of the **My_user** configuration node.

![set output example](https://github.com/majektom/node-red-contrib-satel-integra-integration/raw/master/doc/images/set_output_example_flow.png "Set output and get its state example")

<details>
  <summary>Click to expand the flow</summary>

  ```json
[
    {
        "id": "e6b0a445.412a38",
        "type": "tab",
        "label": "Set output and get its state example",
        "disabled": false,
        "info": ""
    },
    {
        "id": "676de317.d5b64c",
        "type": "satel-integra-encoder",
        "z": "e6b0a445.412a38",
        "name": "Encode",
        "user": "2c6f5b4e.dc1a8c",
        "prefix": "",
        "x": 480,
        "y": 200,
        "wires": [
            [
                "6c367b6.f6e8b04"
            ]
        ]
    },
    {
        "id": "a3668de5.0418a8",
        "type": "satel-integra-decoder",
        "z": "e6b0a445.412a38",
        "name": "Decode",
        "x": 860,
        "y": 200,
        "wires": [
            [
                "bc8368f.d891718"
            ]
        ]
    },
    {
        "id": "6c367b6.f6e8b04",
        "type": "satel-integra-connection",
        "z": "e6b0a445.412a38",
        "name": "",
        "server_address": "192.168.1.4",
        "server_port": "7094",
        "encryption": false,
        "max_message_queue_size": "128",
        "x": 670,
        "y": 200,
        "wires": [
            [
                "a3668de5.0418a8"
            ]
        ]
    },
    {
        "id": "512e2634.ce62c",
        "type": "inject",
        "z": "e6b0a445.412a38",
        "name": "new_data command",
        "props": [
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "1",
        "crontab": "",
        "once": true,
        "onceDelay": "5",
        "topic": "new_data",
        "x": 280,
        "y": 200,
        "wires": [
            [
                "676de317.d5b64c"
            ]
        ]
    },
    {
        "id": "bc8368f.d891718",
        "type": "switch",
        "z": "e6b0a445.412a38",
        "name": "Answer switch",
        "property": "topic",
        "propertyType": "msg",
        "rules": [
            {
                "t": "eq",
                "v": "new_data",
                "vt": "str"
            },
            {
                "t": "eq",
                "v": "outputs_state",
                "vt": "str"
            }
        ],
        "checkall": "false",
        "repair": false,
        "outputs": 2,
        "x": 1020,
        "y": 200,
        "wires": [
            [
                "c6605072.11349"
            ],
            [
                "30c88e9.8160bf2"
            ]
        ]
    },
    {
        "id": "c6605072.11349",
        "type": "switch",
        "z": "e6b0a445.412a38",
        "name": "outputs_state switch",
        "property": "payload",
        "propertyType": "msg",
        "rules": [
            {
                "t": "jsonata_exp",
                "v": "payload[23]",
                "vt": "jsonata"
            }
        ],
        "checkall": "true",
        "repair": false,
        "outputs": 1,
        "x": 600,
        "y": 100,
        "wires": [
            [
                "48638c6.a4ec474"
            ]
        ],
        "outputLabels": [
            "zones_violation"
        ]
    },
    {
        "id": "48638c6.a4ec474",
        "type": "change",
        "z": "e6b0a445.412a38",
        "name": "outputs_state command",
        "rules": [
            {
                "t": "set",
                "p": "topic",
                "pt": "msg",
                "to": "outputs_state",
                "tot": "str"
            }
        ],
        "action": "",
        "property": "",
        "from": "",
        "to": "",
        "reg": false,
        "x": 270,
        "y": 160,
        "wires": [
            [
                "676de317.d5b64c"
            ]
        ]
    },
    {
        "id": "30c88e9.8160bf2",
        "type": "change",
        "z": "e6b0a445.412a38",
        "name": "Set output 17 state",
        "rules": [
            {
                "t": "set",
                "p": "payload",
                "pt": "msg",
                "to": "{\"on\": msg.payload[16]}",
                "tot": "jsonata"
            }
        ],
        "action": "",
        "property": "",
        "from": "",
        "to": "",
        "reg": false,
        "x": 550,
        "y": 260,
        "wires": [
            [
                "a46a34c3.7b7308"
            ]
        ]
    },
    {
        "id": "a46a34c3.7b7308",
        "type": "rbe",
        "z": "e6b0a445.412a38",
        "name": "",
        "func": "rbe",
        "gap": "",
        "start": "",
        "inout": "out",
        "property": "payload",
        "x": 710,
        "y": 260,
        "wires": [
            [
                "35225d1b.22989a"
            ]
        ]
    },
    {
        "id": "35225d1b.22989a",
        "type": "debug",
        "z": "e6b0a445.412a38",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 850,
        "y": 260,
        "wires": []
    },
    {
        "id": "6f403932.107f18",
        "type": "comment",
        "z": "e6b0a445.412a38",
        "name": "",
        "info": "# Set output and get its state\n\nThis example flow provides two inject nodes by means of which the user can switch on or off **output 17**. Additionally, *new_data* command is injected every second to detect any change in the system. When it detects a change in outputs state, it sends *outputs_state* command to get current outputs state. If the state of the **output 17** has changed, a message with the current state of the output is being sent to the debug node.\n\n**Note**: The Integra system indexes zones, outputs, partitions, etc. starting from index 1, so all indices in message arrays are shifted by -1 (i.e. `index in the array` == `Integra index - 1`).\n\n**Note**: Every command changing the system state requires authorization. Therefore, the encode node has the **User** field set to *My_user* configuration node. In order to make the example work in user's system, the user has to set valid user code in the **Code** filed of the **My_user** configuration node.\n",
        "x": 600,
        "y": 60,
        "wires": []
    },
    {
        "id": "6b000e69.9e1fc8",
        "type": "inject",
        "z": "e6b0a445.412a38",
        "name": "Switch on",
        "props": [
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "outputs_on",
        "x": 140,
        "y": 240,
        "wires": [
            [
                "1ec760f3.c1c5b7"
            ]
        ]
    },
    {
        "id": "1f0e86b.24ae5f9",
        "type": "inject",
        "z": "e6b0a445.412a38",
        "name": "Switch off",
        "props": [
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "outputs_off",
        "x": 140,
        "y": 280,
        "wires": [
            [
                "1ec760f3.c1c5b7"
            ]
        ]
    },
    {
        "id": "1ec760f3.c1c5b7",
        "type": "function",
        "z": "e6b0a445.412a38",
        "name": "Set output 17",
        "func": "msg.outputs = new Array(128).fill(false);\nmsg.outputs[16] = true;\nreturn msg;\n",
        "outputs": 1,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "x": 310,
        "y": 240,
        "wires": [
            [
                "676de317.d5b64c"
            ]
        ]
    },
    {
        "id": "2c6f5b4e.dc1a8c",
        "type": "satel-integra-user",
        "z": "",
        "name": "My_user"
    }
]
  ```

</details>

## Appreciation

If you want to say thank you by donation, you can do it here:

[![Donate](https://www.paypalobjects.com/en_US/PL/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate?hosted_button_id=7DQMX6KQZ8R42)
