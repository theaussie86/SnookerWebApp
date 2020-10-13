$(function(){
    $('#change').on('click', function() {
        var prev = $('.change'),
            ro   = prev.prop('readonly');        
        prev.prop('readonly', !ro).focus();

        $(this).text(function(i, text){
            return text === 'Ändern' ? 'Speichern' : 'Ändern';
        });

        if ($(this).text()==='Ändern'){
            $('#profileform').submit();
        } else {
        }
    });

    $('#sharedetails').on('change',function(){
        var share = $(this).prop('checked');
        if($('div.alert').length>0) $('div.alert').remove();
        $.ajax({
            type: 'GET',
            url: '/data/details',
            data:{
                share: share
            },            
            success: function(msg){
                if (msg.success_msg){
                    var mtype = 'alert-success';
                    var message = msg.success_msg;
                } else {
                    var mtype = 'alert-danger';
                    var message = msg.error_msg;
                }
                $('#myTabContent').prepend('<div class="alert small '+mtype+' alert-dismissable "><a href="#" class="close" data-dismiss="alert" aria-label="close" title="close">×</a>'+
                message+'</div>');
            }
        });
    });
});