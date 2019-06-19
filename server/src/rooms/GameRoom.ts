import { Room, Client } from "colyseus";

import { StateHandler } from "./StateHandler";
import { Player } from "../entities/Player";

export class GameRoom extends Room<StateHandler> {
    maxClients = 8;

    onInit (options) {
        this.setSimulationInterval(() => this.onUpdate());
        this.setState(new StateHandler());
    }

    requestJoin (options) {
        return true;
    }

    onJoin (client) {
        const player = new Player();
        player.name = `Player ${ this.clients.length }`;

        this.state.players[client.sessionId] = player;
    }

    onMessage (client: Client, message: any) {
        const [event, data] = message;
        const player: Player = this.state.players[client.sessionId];

        if (event === "pos") {
            player.camPos = data;
        }
    }

    onUpdate () {
        for (const sessionId in this.state.players) {
            const player: Player = this.state.players[sessionId];
            player.position.x = player.camPos.x;
			player.position.y = player.camPos.y;
            player.position.z = player.camPos.z;
			console.log(player.camPos.x + " " + player.camPos.y + " " + player.camPos.z);
        }
    }

    onLeave (client: Client) {
        delete this.state.players[client.sessionId];
    }

    onDispose () {
    }

}
