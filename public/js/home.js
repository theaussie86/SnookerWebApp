jQuery(document).ready(function($){
    var loginForm = $('#loginform');
    var token;

    $(loginForm).submit(function (e) {
        e.preventDefault();
        
        var username = $('#username').val();
        var password = $('#password').val();
        var token = loginUser(username, password);
        function loginUser(username, password) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function(){
                if (this.readyState === 4 && this.status === 200){
                    token = this.getResponseHeader('x-auth');
                    sessionStorage.setItem('x-auth',token);
                }
            };
            xhttp.open('POST','/users/login',true);
            xhttp.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
            xhttp.send("username="+username+"&password="+password);
        };
        $.ajax({
            url: '/members',
            method: 'GET',
            headers:{
                'x-auth': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OWU0NDM4NTIwOGUzNTIyZTA0Yjg0YTYiLCJhY2Nlc3MiOiJhdXRoIiwiaWF0IjoxNTA4MzYyNDg1fQ.F50sE68bZpyyjFoU72SudB7QOSSC8Equw5pqTZUzR68'
            },
            success: function (data) {
                
            }
        });
    });
});