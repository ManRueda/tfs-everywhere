import child_process = require("child_process");
import fs = require("fs");
import {tf_path} from "./ModGlobals";

export class Workspace {
    private _user: string;
    private _password: string;
    private _collection: string;
    private _cwd: string;

    constructor(collection: string, user: string, password: string, cwd?: string) {
        this._collection = collection;
        this._user = user;
        this._password = password;
        this._cwd = cwd || process.cwd();
    }

    listLocalWorkspaces(): Promise<IWorkspace[]> {
        return new Promise<IWorkspace[]>((resolve, reject) => {
            child_process.exec(tf_path + " workspaces -collection:" + this._collection + " -login:" + this._user + "," + this._password, {
                cwd: this._cwd
            }, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                }
                if (stdout) {
                    resolve(ITableToIWorkspace(parseTable(removeTrashResponse(stdout.toString()))));
                }
            });
        });
    }
}

let _infoLineRegex = /INFO:.*/;
let _datedRecordRegex = /\w*\s\d*,\s\d{4}\s\d{2}:\d{2}:\d{2}\s\w{2}\s.*/;
let _CollectionLineRegex = /Collection: https?:\/\/?[\da-z\.-]+\.[a-z\.]{2,6}[\/\w \.-]*\/?/;

function removeTrashResponse(raw: string): string {

    raw = raw.split(_infoLineRegex).join("");
    raw = raw.split(_datedRecordRegex).join("");
    raw = raw.split(_CollectionLineRegex).join("");

    return raw;
}

let _tableIsSizerRegex = /^[-\s]*$/;
let _tableSizerRegex = /-*\s*/g;
let _headersRegex = /\w*\s*/g;

function parseTable(raw: string): ITable {
    let hearder: string[];
    let sizer: number[];
    let content: [string[]];
    let alreadyPassDelimiter = false;

    sizer = [];
    content = <[string[]]>[];

    raw.split("\n").forEach((value, index, array) => {
        if (value !== "" && !alreadyPassDelimiter && value.match(_tableIsSizerRegex)) {
            alreadyPassDelimiter = true;
            hearder = array[index - 1].match(_headersRegex)
                .map(v => v.trim())
                .filter( v => v !== "");

            value.match(_tableSizerRegex)
                .map(v => v.trim())
                .filter( v => v !== "")
                .forEach(v => sizer.push(v.length));
        }
        if (value !== "" && alreadyPassDelimiter && value.match(_tableIsSizerRegex) === null) {
            let row = [];
            let cumulated = 0;
            sizer.forEach( (size, _index, _array) => {
                row.push(value.substr(cumulated, size));
                cumulated = cumulated + size + 1;
            });
            content.push(row);
        }
    });
    return <ITable>{
        headers: hearder,
        sizer: sizer,
        rows: content
    };
}

function ITableToIWorkspace(table: ITable): IWorkspace[] {
    return table.rows.map(v => <IWorkspace>{
        name: v[0],
        owner: v[1],
        computer: v[2],
        comments: v[3],
    });
}

export interface ITable {
    headers: string[];
    sizer: number[];
    rows: [string[]];
}

export interface IWorkspace {
    name: string;
    owner: string;
    computer: string;
    comments: string;
}

