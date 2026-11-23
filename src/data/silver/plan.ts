import raw from './plan.ktpm.json';
import { catalog } from './catalog';
import type { GamePlan, PlanTerm, SilverCatalog, TermId } from '../../types/silver';
import { arr, fail, num, obj, oneOf, str } from '../validate';
const termIds: TermId[] = ['1.1','1.2','1.3','1.4','2.1','2.2','2.3','2.4','3.1','3.2','3.3','3.4','4.1','4.2','4.3','4.4','5.1','5.2','5.3','5.4'];
const strings=(v:unknown,path:string):string[]=>arr(v,path).map((x,i)=>str(x,`${path}[${i}]`));
export function termCodes(term:PlanTerm):string[]{return [...term.courses,...term.electives.map(e=>e.default)];}
export function parsePlan(value:unknown,source:SilverCatalog):GamePlan {
 const root=obj(value,'plan'); if(root.official!==false)fail('plan.official','false');
 const terms=arr(root.terms,'plan.terms').map((value,i):PlanTerm=>{const path=`plan.terms[${i}]`,t=obj(value,path);const electives=arr(t.electives,`${path}.electives`).map((value,j)=>{const e=obj(value,`${path}.electives[${j}]`);return{group:str(e.group,`${path}.group`),default:str(e.default,`${path}.default`)};});return{term:oneOf(t.term,termIds,`${path}.term`),kind:oneOf(t.kind,['english','registration','graduation'] as const,`${path}.kind`),core:strings(t.core,`${path}.core`),courses:strings(t.courses,`${path}.courses`),electives,credits:num(t.credits,`${path}.credits`)};});
 if(terms.length!==20||terms.some((t,i)=>t.term!==termIds[i]))fail('plan.terms','20 kỳ liên tục đúng thứ tự');
 const seen=new Set<string>(),done=new Set<string>();
 for(const t of terms){const codes=termCodes(t);for(const code of codes){const course=source.courses.find(c=>c.code===code);if(!course)fail(t.term,`mã ${code} tồn tại`);if(seen.has(code))fail(t.term,`môn ${code} không trùng`);seen.add(code);if(course.prereq.mode!=='unresolved')for(const pre of course.prereq.codes)if(!done.has(pre))fail(t.term,`${code} yêu cầu ${pre} trước đó`);}
 for(const core of t.core)if(!codes.includes(core))fail(t.term,`${core} thuộc termCodes`);
 for(const elective of t.electives){const group=source.groups.find(g=>g.id===elective.group);if(!group||!group.courses.includes(elective.default))fail(t.term,`${elective.default} thuộc group ${elective.group}`);}
 const credits=codes.reduce((sum,code)=>sum+(source.courses.find(c=>c.code===code)?.credits??0),0);if(credits!==t.credits)fail(t.term,'credits bằng tổng môn');for(const code of codes)done.add(code);
 }
 return{version:1,majorId:str(root.majorId,'plan.majorId'),official:false,terms};
}
export const plan=parsePlan(raw,catalog);
export function getTerm(id:TermId):PlanTerm|undefined{return plan.terms.find(t=>t.term===id);}
export function plannedBefore(term:TermId):string[]{const i=termIds.indexOf(term);return plan.terms.slice(0,i).flatMap(termCodes);}
