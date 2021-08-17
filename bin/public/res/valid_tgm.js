function validate(){
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    if(password.length>0&&username.length>0){
        /*
        Der Lernbüro Planer codiert lustigerweise die Zugangsinformationen vor dem schicken der XHR-Anfrage indem er die einzelnen Zeichen mit 1337 potenziert.
        */
        function g(t, e=1337) {
            let n = "";
            for (let a = 0; a < t.length; a++) {
                let r = t.charCodeAt(a) ^ e;
                n += String.fromCharCode(r)
            }
            return n
        }

        username = g(username);
        password = g(password);
        
        alert(username);

        var xhr = new XMLHttpRequest();
        var url = "https://lb-planer.tgm.ac.at/api/v1/login";
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var json = JSON.parse(xhr.responseText);
                document.getElementById("result").innerHTML='<div style="margin-left:50px;">'+json.err+'</div>';
            }
        };
        var data = JSON.stringify({"username":username,"password":password});
        xhr.send(data);
        document.getElementById("result").innerHTML='<div class="loader"></div>';
    }
}