function add1(v1: number, v2: number): number{
    return v1 + v2;
}

const result1 = add1(1,2);
console.log(add1)
console.log(`result1 = ${result1}`)

const add2 = function(v1: number, v2: number): number{
    return v1 + v2;
}

const result2 = add2(1,2)
console.log(add2)
console.log(`result1 = ${result2}`)

const add3 = (v1:number, v2:number):number =>{
    return v1 + v2;
}
console.log(add3(1,3))

console.log(add3)

function add(v1:number, v2:number){
    return v1 + v2
}