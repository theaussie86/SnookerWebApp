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

    $('#download').on('click',function(e){
        e.preventDefault();
        if ($('#cbomonth').val()==0) {
            $('.alert').remove();
            $("[for='datum']").before('<div class="alert small alert-danger alert-dismissable "><a href="#" class="close" data-dismiss="alert" aria-label="close" title="close">×</a>Du musst einen Monat auswählen!</div>');
            return false;
        }
        if ($('#cboyear').val()==0) {
            $('.alert').remove();
            $("[for='datum']").before('<div class="alert small alert-danger alert-dismissable "><a href="#" class="close" data-dismiss="alert" aria-label="close" title="close">×</a>Du musst einen Jahr auswählen!</div>');
            return false;
        }
        $.ajax({
            type: 'GET',
            url: '/board/download',
            data:{
                monat: $('#cbomonth').val(),
                jahr: $('#cboyear').val()
            },
            success: function(data){
                console.log(data);
            }
        })
    });
});