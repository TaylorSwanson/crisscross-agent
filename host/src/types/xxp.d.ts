declare module "xxp" {

  interface LooseStringObject {
    [key: string]: any
  }

  interface PacketPayload {
    content: LooseStringObject,
    header: LooseStringObject
  }

  interface PacketObject {
    packet: Buffer,
    id: string
  }

  export function newPacket({ content, header }: PacketPayload): PacketObject;
  export function packetDecoder(connection: NodeJS.Socket, Function): void;
}
