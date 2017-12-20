$(function(){
    var year=2015
    while(year<= new Date().getFullYear()){
        $('#cboyear').append('<option value="'+year+'">'+year+'</option>');
        year++
    }
    $('#test').on('click',function(e){
        e.preventDefault();
        $.ajax({
            type: 'GET',
            url: '/board/test',
            data:{
                monat: $('#cbomonth').val(),
                jahr: $('#cboyear').val(),
                username: 'Marian'
            },
            success: function(data){
                console.log(data);
            }
        })
    });
});