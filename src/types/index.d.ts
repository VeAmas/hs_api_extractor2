import { SourceLocation, Node } from "@babel/types";

export type Module = string;
export type Member = { name: string; nodes: Node[] };
export type Members = Member[] | "*";
export type MemberRef = {
  name: string;
  alias: string;
};

type HasLoc = {
  loc: SourceLocation | null;
};
export type ImportBase = MemberRef & {
  source: Module;
};
export type Import = ImportBase & HasLoc;
export type Exports = {
  extends?: Module[];
  members: Array<MemberRef & HasLoc>;
};
export type Declarations = {
  [name: string]: HasLoc & {
    dependencies: (Member | ImportBase)[];
  };
};
export type MemberRelation = {
  [name: string]: (Member | ImportBase)[];
};

export type Entry = {
  source: Module;
  name: Member;
};

export type API = {
  isApi: true | false | "unknown";
  urls: string[];
  name: string;
  unknownApi: API[];
  source?: string;
};
